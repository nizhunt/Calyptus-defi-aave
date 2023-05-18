
# Aave Defi hardhat + ethers


## Introduction

This project is a simple POC that allows AAVE V2 DAI and LINK lending pool investment on Mumbai testnet.

The platform uses smart contracts to interact with AAVE lending pools. 

## Requirments
- Node 16 
- Yarn
- Hardhat

## Smart contract installation

```
cd ./hardhat
```

```
yarn install
```

Create an .env file with  the following
```
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your-alchemy-id // or any other rpc provider
PRIVATE_KEY=your-private-key // Used during deploy
POLYGONSCAN_API_KEY=your-etherscan-key // Used during deploy for smart contract verification in polygonscan
REPORT_GAS=true // To get a gas report when executing tests
COINMARKETCAP_API_KEY=your-coinmarketcap-api-key // To get the smart contracts deployment and methods cost in usd when executing the tests
```

Compile
```
yarn hardhat compile
```

Deploy

```
yarn hardhat deploy --network networkName
```

Tests
```
yarn hardhat test
```

Coverage
```
yarn hardhat coverage
```


## Front-end Installation


```sh
cd client
yarn install
```

You have to create a .env file in the client directory with the following content:
```
REACT_APP_PROTOCOL_DATA_PROVIDER_AAVE2_CONTRACT_ADDRESS=0x927F584d4321C1dCcBf5e2902368124b02419a1E // contract address of AAVE 2 data provider on Mumbai network
REACT_APP_DAI_CONTRACT_ADDRESS=0x75Ab5AB1Eef154C0352Fc31D2428Cef80C7F8B33 // DAI address on Mumbai network (DAI used in AAVE 2)
REACT_APP_LINK_CONTRACT_ADDRESS=0x7337e7FF9abc45c0e43f130C136a072F4794d40b // LINK address on Mumbai network (LINK used in AAVE 2)
```

