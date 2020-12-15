#include "dbOperat.h"
#include "sds/sds.h"
#include "sqlite/sqlite3.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// struct of query result
struct Query_Result {
    char* errMsg;
    int rows;
    int columns;
    char** dataset;
};

// struct of execute result
struct Exec_Result {
    char* name;
    char* errMsg;
    int errCode;
};

// sqlite callback function define
static int callback(void* NotUsed, int argc, char** argv, char** azColName)
{
    int i = 0;
    for(i = 0; i < argc; i++) {
        // printf("%s = %s\n", azColName[i], argv[i] ? argv[i] : "NULL");
    }

    // printf("\n");
    return 0;
}

// query function
struct Query_Result Query(sqlite3* db, char* sql)
{
    char* zErrMsg = 0;
    int rc;

    struct Query_Result query;

    rc = sqlite3_get_table(db, sql, &query.dataset, &query.rows, &query.columns, &zErrMsg);
    if(SQLITE_OK != rc) {
        // fprintf(stderr, "SQL error: %s\n", zErrMsg);
        sqlite3_free(zErrMsg);
    }
    query.errMsg = zErrMsg;
    return query;
}

// execute function
static struct Exec_Result Exec(sqlite3* db, char* sql)
{
    char* zErrMsg = 0;
    int rc;
    const char* data = "Callback function called";
    struct Exec_Result result;

    rc = sqlite3_exec(db, sql, callback, (void*)data, &zErrMsg); // execute sql command
    if(SQLITE_OK != rc) {
        // fprintf(stderr, "SQL error: %s\n", zErrMsg);
        result.errCode = 1;
        result.errMsg = "fail";
        strcpy(result.errMsg, zErrMsg);
        sqlite3_free(zErrMsg);
    } else {
        result.errCode = 0;
        result.errMsg = "success";
        // fprintf(stdout, "Operation done successfully\n");
    }
    return result;
}

int dbBackup(char* source, char* dest)
{
    sqlite3* dbSource = NULL;
    sqlite3* dbDest = NULL;
    sqlite3_backup* backup;
    int errCode;

    int opSourceRe =
        sqlite3_open_v2(source, &dbSource, SQLITE_OPEN_READONLY | SQLITE_OPEN_NOMUTEX | SQLITE_OPEN_SHAREDCACHE, NULL);
    int opDestRe = sqlite3_open_v2(dest, &dbDest,
        SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_NOMUTEX | SQLITE_OPEN_SHAREDCACHE, NULL);
    if(opSourceRe == SQLITE_OK && opDestRe == SQLITE_OK) {
        // printf("open result: %d,%d\r\n", opSourceRe, opDestRe);

        backup = sqlite3_backup_init(dbDest, "main", dbSource, "main");
        if(backup) {
            do {
                errCode = sqlite3_backup_step(backup, -1);

                if(errCode == SQLITE_OK || errCode == SQLITE_BUSY || errCode == SQLITE_LOCKED) {
                    sqlite3_sleep(250);
                }
            } while(errCode == SQLITE_OK || errCode == SQLITE_BUSY || errCode == SQLITE_LOCKED);

            sqlite3_backup_finish(backup);
        }
        errCode = sqlite3_errcode(dbDest);

        sqlite3_close_v2(dbSource);
        sqlite3_close_v2(dbDest);
    } else {
        errCode = sqlite3_errcode(dbSource);
    }

    return errCode;
}

int dbCopy(char* source, char* dest)
{
    int errCode; // SQLite ResultCodesValue + 41000
    // source db and dest db path is not null
    if(strlen(source) != 0 && strlen(dest) != 0) {
        sqlite3* dbSource = NULL;
        sqlite3* dbDest = NULL;

        int canBeRemove = 1; // source db can be remove tag

        // open dest db, create a new db if it's not exists
        int opDestRe = sqlite3_open_v2(dest, &dbDest,
            SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_NOMUTEX | SQLITE_OPEN_SHAREDCACHE, NULL);

        // open dest db success
        if(opDestRe == SQLITE_OK) {
            // open source db
            int opSourceRe = sqlite3_open_v2(
                source, &dbSource, SQLITE_OPEN_READONLY | SQLITE_OPEN_NOMUTEX | SQLITE_OPEN_SHAREDCACHE, NULL);
            // open source db success
            if(opSourceRe == SQLITE_OK) {
                // fprintf(stdout, "open source db success\r\n");

                // close source db
                sqlite3_close_v2(dbSource);
                // fprintf(stdout, "close source db success\r\n");

                sds attachSql = sdsempty();
                char* tokens[3] = { "ATTACH DATABASE '", source, "' as 'logdb';" };
                attachSql = sdsjoin(tokens, 3, "");
                // fprintf(stdout, "ready to attach source db to dest\r\n");
                // attach source db to dest db
                struct Exec_Result attachResult = Exec(dbDest, attachSql);
                sdsfree(attachSql);
                if(attachResult.errCode == 0) {
                    // attach success
                    // fprintf(stdout, "attach to dest db: %s\r\n", attachResult.errMsg);
                    // get database schema info
                    struct Query_Result schemaSet = Query(dbDest, "PRAGMA database_list;");
                    // fprintf(stdout, "db schema count: %d \r\n", schemaSet.rows);
                    if(NULL != schemaSet.errMsg) {
                        // canBeRemove = can't
                        canBeRemove &= 0;
                        sqlite3_free_table(schemaSet.dataset);
                    } else {
                        // if there are at least 2 schemas, the ATTACH is successful.
                        if(schemaSet.rows >= 2) {
                            char* getSourceTabSql = "select name \n"
                                                    "from logdb.sqlite_master \n"
                                                    "where type='table' \n"
                                                    "and name not in ('sqlite_sequence') \n"
                                                    "order by name;";
                            // get source db table info
                            struct Query_Result tabSet = Query(dbDest, getSourceTabSql);

                            if(NULL != tabSet.errMsg) {
                                // canBeRemove = can't
                                canBeRemove &= 0;
                                sqlite3_free_table(tabSet.dataset);
                            } else {
                                // fprintf(stdout, "there are %d tables\r\n", tabSet.rows);
                                for(int i = 0; i < tabSet.rows + 1; i++) {
                                    // except for the column head name
                                    if(i > 0) {
                                        // fprintf(stdout, "\ttable: %s", tabSet.dataset[i]);
                                        // check table exists sql
                                        char* tabEx[3] = {
                                            "select name from sqlite_master where type='table' and name = '",
                                            tabSet.dataset[i], "';"
                                        };
                                        sds tabExistsSql = sdsjoin(tabEx, 3, "");
                                        // check
                                        // sprintf("%s\r\n",tabExistsSql);
                                        struct Query_Result tabExistsSet = Query(dbDest, tabExistsSql);
                                        sdsfree(tabExistsSql);
                                        if(NULL != tabExistsSet.errMsg) {
                                            // canBeRemove = can't
                                            canBeRemove &= 0;
                                            sqlite3_free_table(tabExistsSet.dataset);
                                        } else {
                                            // check result
                                            if(tabExistsSet.rows == 0) {
                                                // not exists: create table and insert data
                                                // fprintf(stdout, "\tnot exist\r\n");
                                                char* createToken[5] = { "CREATE TABLE ", tabSet.dataset[i],
                                                    " AS SELECT * FROM logdb.", tabSet.dataset[i], ";" };
                                                sds createSql = sdsjoin(createToken, 5, "");

                                                struct Exec_Result createResult = Exec(dbDest, createSql);
                                                sdsfree(createSql);
                                                if(createResult.errCode == 0) {
                                                    // fprintf(stdout, "\t\tcreate: %s\r\n", createResult.errMsg);
                                                } else {
                                                    // canBeRemove = can't
                                                    canBeRemove &= 0;
                                                    // fprintf(stderr, "\t\tcreate: %s\r\n", createResult.errMsg);
                                                }
                                            } else {
                                                // exists: insert not exist record
                                                // fprintf(stdout, "\texist\r\n");
                                                char* insertToken[9] = { "INSERT INTO ", tabSet.dataset[i],
                                                    " select s.* from logdb.", tabSet.dataset[i], " s left join ",
                                                    tabSet.dataset[i],
                                                    " d on s._id==d._id WHERE s._id not in (select _id from ",
                                                    tabSet.dataset[i], ");" };
                                                sds insertSql = sdsjoin(insertToken, 9, "");

                                                // printf("%s\n", insertSql);
                                                struct Exec_Result insertResult = Exec(dbDest, insertSql);
                                                sdsfree(insertSql);
                                                if(insertResult.errCode == 0) {
                                                    // fprintf(stdout, "\t\tinsert: %s\r\n", insertResult.errMsg);
                                                } else {
                                                    // canBeRemove = can't
                                                    canBeRemove &= 0;
                                                    // fprintf(stderr, "\t\tinsert: %s\r\n", insertResult.errMsg);
                                                }
                                            }
                                            sqlite3_free_table(tabExistsSet.dataset);
                                        }
                                    }
                                }
                                sqlite3_free_table(tabSet.dataset);
                            }

                            char* detachSql = "DETACH DATABASE 'logdb';";
                            // DETACH source db from dest DB
                            struct Exec_Result detachResult = Exec(dbDest, detachSql);
                            if(detachResult.errCode == 0) {
                                // fprintf(stdout, "\t\tdetach: %s\r\n", detachResult.errMsg);
                            } else {
                                // fprintf(stderr, "\t\tdetach: %s\r\n", detachResult.errMsg);
                            }

                        } else {
                            canBeRemove &= 0;
                        }
                    }

                } else {
                    // attach failed
                    // fprintf(stderr, "attach to dest db: %s\r\n", attachResult.errMsg);
                    errCode = attachResult.errCode;
                }
                errCode = sqlite3_errcode(dbDest);

                sqlite3_close_v2(dbDest);
                // printf("should remove source db\r\n");

                /*
                if(errCode == SQLITE_OK && canBeRemove) {
                    // remove source db

                    // errCode = remove(source);

                    errCode = remove("C:\\Users\\Bruce\\Desktop\\libDbMigration.so");

                    if(errCode == 0) {
                        fprintf(stdout, "remove source db success\r\n");
                    } else {
                        fprintf(stderr, "remove source db failed\r\n");
                    }
                }
                */
            } else {
                errCode = sqlite3_errcode(dbSource);
            }
        } else {
            errCode = opDestRe;
        }
        // can't be removed, means an error occurred
        if(canBeRemove == 0) {
            errCode = -901;
        }
    } else {
        errCode = -998; // parameter format error
    }
    if(errCode != 0) {
        errCode += 41000; // SQLite Result Code offset
    }
    
    return errCode;
}