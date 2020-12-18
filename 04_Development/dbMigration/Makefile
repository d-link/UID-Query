dbMigration:main.c dbOperat.c
	gcc -o dbMigration main.c dbOperat.c ./lib/sqlite/sqlite3.c ./lib/sds/sds.c ./lib/parson/parson.c -I ./lib -ldl -lpthread
clean:
	rm dbMigration
