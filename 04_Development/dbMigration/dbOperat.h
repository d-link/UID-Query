#ifndef DBOPERAT_H
#define DBOPERAT_H

extern int DEBUG_MODE;
/**
 * @brief database online backup
 * @param source database
 * @param dest database
 * @return error code
 */
int dbBackup(char* source, char* dest);

/**
 * @brief database copy
 * @param source database
 * @param dest database
 * @return error code
 */
int dbCopy(char* source, char* dest);

#endif // DBOPERAT_H
