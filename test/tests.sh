#!/usr/bin/env bash
if [ ! -f truffle-config.js ]; then
  ln -s networks.js truffle-config.js;
fi

project_id=$(jq '.projectId' secrets.json | sed 's/"//g');
mnemonic=$(jq '.mnemonic' secrets.json | sed 's/"//g');

function cleanup {
  kill -9 "$ganache_pid"
}

trap cleanup EXIT

# ./node_modules/.bin/ganache-cli -f "https://mainnet.infura.io/v3/$project_id" -m "$mnemonic"  --port 8545 --gasLimit 0xffffffffff --allowUnlimitedContractSize -u "0x9759A6Ac90977b93B58547b4A71c78317f391A28"  - > /dev/null & ganache_pid=$!
./node_modules/.bin/ganache-cli -m "$mnemonic" --port 8545 --gasLimit 0xffffffffff --allowUnlimitedContractSize - > /dev/null & ganache_pid=$!

echo "ganache pid ${ganache_pid}"

./node_modules/.bin/truffle test --network development
