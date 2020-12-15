gcc -fPIC -shared -o libDbMigration.so dbOperat.c ./lib/sqlite/sqlite3.c ./lib/sds/sds.c -I ./lib
gcc -o dbMigration main.c dbOperat.c ./lib/sqlite/sqlite3.c ./lib/sds/sds.c ./lib/parson/parson.c -I ./lib -ldl -lpthread
