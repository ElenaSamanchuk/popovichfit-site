#!/usr/bin/env bash
# Только локальная упаковка уже проверенной гибридной сборки. Ничего не собирает и не отправляет.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
if [[ ${1:-} == --help || $# -ne 3 ]]; then
  echo "Usage: bash deploy/package-admin-preview.sh OUTPUT_DIR DEST_PARENT RELEASE_ID"
  echo "Example: bash deploy/package-admin-preview.sh .output ../popovichfit-admin-packages 20261109-preview-01"
  [[ ${1:-} == --help ]] && exit 0
  exit 2
fi
python3 - "$1" "$2" "$3" "$ROOT/deploy/ADMIN-PREVIEW.md" <<'PY'
import hashlib, os, pathlib, re, shutil, sys, tarfile, tempfile
source, parent, release, instructions = sys.argv[1:]
src = pathlib.Path(source).resolve(strict=True)
parent = pathlib.Path(parent).resolve()
if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,79}', release):
    sys.exit('ERROR: RELEASE_ID: только буквы, цифры, _ и -, максимум 80 символов')
if parent == src or src in parent.parents:
    sys.exit('ERROR: результат должен находиться вне исходной сборки')
for name in ('server/index.mjs', 'public/index.html', 'redirects.map'):
    if not (src / name).is_file() or (src / name).stat().st_size == 0:
        sys.exit('ERROR: неполная гибридная сборка: ' + name)
homepage = (src / 'public' / 'index.html').read_text(encoding='utf-8')
if not re.search(r'<meta\b[^>]*name="robots"[^>]*content="noindex', homepage) or 'senndder.ru/' in homepage:
    sys.exit('ERROR: для пакета нужна сборка POPOVICHFIT_PREVIEW=1 без Sender')
if any((src / 'public' / p).exists() for p in ('sales-open', 'sales-open.html', 'pred', 'pred.html', 'predcor', 'predcor.html', 'predpow', 'predpow.html')):
    sys.exit('ERROR: найдены статические страницы/маркер открытых продаж')
# Не читать содержимое секретов; разрешён только runtime и public из .output.
allowed = {'server', 'public', 'redirects.map', 'nitro.json'}
if any(p.name not in allowed for p in src.iterdir()):
    sys.exit('ERROR: неожиданный объект в корне сборки; проверьте состав вручную')
for p in src.rglob('*'):
    if p.name == '.data' or p.name.startswith('.env') or p.suffix.lower() in ('.pem', '.key'):
        sys.exit('ERROR: запрещённый файл/каталог в сборке (имя не выводится)')
    if p.is_symlink():
        target = p.resolve(strict=True)
        if os.path.isabs(os.readlink(p)) or (target != src and src not in target.parents):
            sys.exit('ERROR: ссылка за пределы сборки или абсолютная ссылка')
    elif not p.is_file() and not p.is_dir():
        sys.exit('ERROR: неподдерживаемый тип файла')
parent.mkdir(parents=True, exist_ok=True)
final = parent / ('popovichfit-' + release)
if final.exists():
    sys.exit('ERROR: пакет уже существует; не перезаписываем')
stage = pathlib.Path(tempfile.mkdtemp(prefix='.pf-package-', dir=parent))
try:
    name = 'popovichfit-' + release + '.tar.gz'
    archive = stage / name
    with tarfile.open(archive, 'w:gz', format=tarfile.PAX_FORMAT) as tf:
        for p in sorted(src.iterdir()):
            tf.add(p, arcname=p.name, recursive=True)
    with tarfile.open(archive, 'r:gz') as tf:
        members = tf.getmembers()
        (stage / 'CONTENTS.txt').write_text('\n'.join(m.name for m in members) + '\n')
        if not {'server/index.mjs', 'public/index.html', 'redirects.map'} <= {m.name for m in members}:
            raise RuntimeError('неполный архив')
    digest = hashlib.sha256()
    with archive.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            digest.update(block)
    (stage / (name + '.sha256')).write_text(digest.hexdigest() + '  ' + name + '\n')
    shutil.copyfile(instructions, stage / 'ADMIN-PREVIEW.md')
    (stage / 'RELEASE.txt').write_text('release=' + release + '\nkind=Nuxt/Nitro hybrid\nsales_static_marker=absent\npreview_nginx_update=required\nqa_approval=must_be_supplied_separately\n')
    # mkdir резервирует имя без перезаписи параллельного пакета.
    final.mkdir()
    for p in stage.iterdir():
        p.rename(final / p.name)
    stage.rmdir()
    print('Пакет: ' + str(final))
    print('SHA-256: ' + digest.hexdigest())
except BaseException:
    shutil.rmtree(stage, ignore_errors=True)
    raise
PY
