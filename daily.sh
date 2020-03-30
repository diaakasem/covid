#!/bin/bash -
#===============================================================================
#
#          FILE: daily.sh
#
#         USAGE: ./daily.sh
#
#   DESCRIPTION:
#
#       OPTIONS: ---
#  REQUIREMENTS: ---
#          BUGS: ---
#         NOTES: ---
#        AUTHOR: YOUR NAME (),
#  ORGANIZATION:
#       CREATED: 03/30/2020 14:43
#      REVISION:  ---
#===============================================================================

set -o nounset                              # Treat unset variables as an error

echo $(date) >> daily.log
npm start | grep 'Daily' >> daily.log

echo "========================================" >> daily.log

