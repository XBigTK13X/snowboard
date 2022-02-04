#! /bin/bash

docker build -t xbigtk13x/snowboard .

if [ ! -z $1 ]; then
  docker push xbigtk13x/snowboard
fi
