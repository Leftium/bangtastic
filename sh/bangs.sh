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
FILENAME_INPUT="$DIR/$NAME.$EXT"
FILENAME_OUTPUT="$DIR/$NAME.$SUFFIX.$EXT"
FILENAME_LOG="$DIR/$NAME.$SUFFIX.log.toml"


# Run clean-bangs; output to file, errors to terminal and file.
echo "bun clean-bangs $@ $FILENAME_INPUT > $FILENAME_OUTPUT 2> >(tee $FILENAME_LOG >&2)"
bun clean-bangs $@ $FILENAME_INPUT > $FILENAME_OUTPUT 2> >(tee $FILENAME_LOG >&2)

# Comment out all lines without TOML syntax (lines that don't start with single quote; FILENAME_LOG-specific convention.)
sed -i -e "s/^[^'].*/# &/" $FILENAME_LOG
