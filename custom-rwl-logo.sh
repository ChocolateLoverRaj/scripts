# This is a script to set a custom RW_LEGACY logo

echo "Copying original RWL_LEGACY bin"
cp $1 $RWL_PATH
echo "$RWL_PATH info:"
./build/cbfstool $RWL_PATH print

echo
echo "Removing payload from copy of rwl bin"
./build/cbfstool $RWL_PATH remove -n altfw/edk2
echo "$RWL_PATH info:"
./build/cbfstool $RWL_PATH print

echo
echo "Extracting payload from coreboot.rom"
echo "coreboot.rom info:"
./build/cbfstool build/coreboot.rom print
./build/cbfstool build/coreboot.rom extract -m x86 -n fallback/payload -f payload.bin

echo
echo "Adding extracted payload to copy of rwl bin"
./build/cbfstool $RWL_PATH add-payload -n altfw/edk -f payload.bin -c LZMA
echo "$RWL_PATH info:"
./build/cbfstool $RWL_PATH print
