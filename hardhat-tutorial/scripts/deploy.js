const { ethers } = require("hardhat");
require("dotenv").config({path: ".env"});

// save WL contract address and baseURL in constants and import
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main() {
    // Address of the whitelist contract deployed in the prev module
    const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
    // URL from where we can extract metadata for a Crypto Dev NFT
    const metadataURL = METADATA_URL;
    /*
    Contract factory - abstation to deploy new smart contracts
    */
   const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

   //deploy with variables stated in contract constructor
   const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
       metadataURL,
       whitelistContract
   );

   //print address of deployed contract
   console.log(
    "Crypto Devs Contract Address",
    deployedCryptoDevsContract.address
    );
} 

//call main function and catch if error
main()
    .then(() => process.exit(0))
    .catch((error)=> {
        console.error(error);
        process.exit(1)
    })

