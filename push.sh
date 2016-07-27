#!/bin/bash
for filename in /extract/DCM/Version 0.0.8/*.xml; do
    for ((i=0; i<=3; i++)); do
        ./MyProgram.exe "$filename" "Logs/$(basename "$filename" .xml)_Log$i.txt"
    done
done