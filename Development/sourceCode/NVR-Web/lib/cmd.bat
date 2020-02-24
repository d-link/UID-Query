echo  change to the path of mongodb installed
set mongopath=%1%
set outputpath=%2%
cd %mongopath%
echo export db CWM2
mongodump.exe -d CWM2 -o %outputpath%