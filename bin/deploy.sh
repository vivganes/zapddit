#!/usr/bin/env bash

. $HOME/.bashrc
. .env
. .env.local

args=(-azvP --delete --exclude=node_modules --exclude=.idea --exclude=.git --exclude=data)
hosts=($HOST_DOMAIN) # tornado lightning thunder tundra jefferson
dry=() #add --dry-run to enable testing
user=$HOST_USER
name=$HOST_PATH
project=$HOST_PROJECT

result=$(ssh $user@$HOST_DOMAIN "[ -d ~/www/$name ] && [ -d ~/www/$name/$project ] && echo 'exists' || echo 'does not exist'")

if [ "$result" == "exists" ]; then
    # If both directories exist, run your command here
    echo "Both directories exist"

    for host in "${hosts[@]}"
    do
      echo ""
      date
      echo "---------------------"
      echo "syncing ${host}"
      echo "---------------------"
      rsync ${dry[@]} ${args[@]} ./ ${user}@${host}:www/${name}/${project}
      ssh -t ${user}@${host} \$HOME/www/${name}/${project}/bin/post-deploy.sh
    done

else
    echo "One or both directories do not exist"
fi

version=$(jq -r .version package.json)
say "$HOST_PROJECT is live!"
exit
