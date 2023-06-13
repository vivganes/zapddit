#!/usr/bin/env bash

cd "$(dirname "$0")/.."
. $HOME/.bashrc
. .env
. .env.local

host=$HOST_DOMAIN
name=$HOST_PATH
project=$HOST_PROJECT

echo "current name: $name"

if [ -d "$HOME/www/${name}/${project}" ]; then
    # If both directories exist, run your command here
    echo "Both directories exist"
    cd $HOME/www/${name}/${project}
    #nvm install v18
    #node -v
    #npm -v
    #npm i

    # run migrations
    #./migrations/users.sh
    # ./migrations/deals.sh
    # ./migrations/comments.sh
    # ./migrations/articles.sh
    # ./migrations/applications.sh
    # ./migrations/services.sh
    # ./migrations/inquiries.sh

    # bump app
    sudo /etc/init.d/nginx reload
    #sudo systemctl daemon-reload
    #sudo systemctl restart ${META_SERVICE}
    # sudo systemctl restart scraper-all
else
    echo "One or both directories do not exist"
fi

