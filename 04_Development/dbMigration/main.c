#include "dbOperat.h"
#include "parson/parson.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

int DEBUG_MODE = 0;

int main(int argc, char** argv)
{
    // json object
    JSON_Value* root_value = json_value_init_object();
    JSON_Object* root_object = json_value_get_object(root_value);

    time_t begin, end;
    time(&begin);

    if(argc >= 3) {
        /**/
        for(int i = 0; i < argc; i++) {
            if(strcmp(argv[i], "-debug") == 0) {
                DEBUG_MODE = 1;
                break;
            }
            // printf("arg:%d %s\r\n", i, argv[i]);
        }

        // int code = dbBackup(argv[1], argv[2]);
        int code = dbCopy(argv[1], argv[2]);
        if(code != 0) {
            json_object_set_boolean(root_object, "success", 0);
            json_object_set_number(root_object, "error", code);
            // fprintf(stderr, "migration result: %d\r\n", code);
        } else {
            json_object_set_boolean(root_object, "success", 1);
            json_object_set_null(root_object, "error");
            // fprintf(stdout, "migration result: %d\r\n", code);
        }

    } else {
        json_object_set_boolean(root_object, "success", 0);
        json_object_set_number(root_object, "error", 40002);
        // fprintf(stderr, "para count is not match\r\n");
    }

    time(&end);
    if(DEBUG_MODE) {
        double spentTime = difftime(end, begin);
        // printf("It takes: %f seconds\r\n", spentTime);
        json_object_set_number(root_object, "spent", spentTime);
    }

    char* serialized_string = json_serialize_to_string_pretty(root_value);
    fprintf(stdout, "%s", serialized_string);
    json_free_serialized_string(serialized_string);
    json_value_free(root_value);

    return 0;
}
