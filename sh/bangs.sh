#!sh
# Usage: bangs.sh INPUT_FILE       SUFFIX EXTRA_PARAMS
#        bangs.sh ./tmp/bangs.json trim   --trim

PATHNAME=$1
SUFFIX=$2
shift 2

# Extract filename components
DIR=$(dirname -- "$PATHNAME")
BASE=$(basename -- "$PATHNAME")
NAME="${BASE%.*}"
EXT="${BASE##*.}"

# Form filenames
IFILENAME="$DIR/$NAME.$EXT"
OFILENAME="$DIR/$NAME.$SUFFIX.$EXT"
EFILENAME="$DIR/$NAME.$SUFFIX.log.txt"

# Run tidy-bangs; output to file, errors to terminal and file.
echo "bun tidy-bangs $@ $IFILENAME > $OFILENAME 2> >(tee $EFILENAME >&2)"
bun tidy-bangs $@ $IFILENAME > $OFILENAME 2> >(tee $EFILENAME >&2)