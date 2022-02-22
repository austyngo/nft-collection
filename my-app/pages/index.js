import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants"; //create constants file with contract address
import styles from "../styles/Home.module.css";

export default function Home() {
  // keep track of whether user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // keep track of whether presale started
  const [presaleStarted, setPresaleStarted] = useState(false);
  // keep track of whether presale ended
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading keep track of whether transaction is processing
  const [loading, setLoading] = useState(false);
  // check if wallet connected is owner of contract
  const [isOwner, setIsOwner] = useState(false);
  // keep track of tokenIds minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // reference to Web3 Modal (connecting to metamask) which persists as long as page is open
  const web3ModalRef = useRef();

  /**
   * presaleMint: mint NFt during presale
   */
  const presaleMint = async () => {
    try{
      // get signer - write transaction
      const signer = await getProviderOrSigner(true); // defined further down in script
      // create new instance of contract with a signer - every function in smart contract requires new instance of contract with signer or provider
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call presaleMint from contract 
      const tx = await whitelistContract.presaleMint({
        // value == cost of one token - parsed as string using ethers.js lib
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for transaction to finish
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };
  /**
   * publicMint: mint NFT after presale ends
   */
  const publicMint = async () => {
    try {
      // get signer to perfrom write transaction
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(  //reused name from presaleMint function
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call mint from contract
      const tx = await whitelistContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for transaction to finish
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * connectWallet
   */
  const connectWallet = async () => {
    try {
      // get provider from web 3 modal / metamask, promts user to connect wallet
      await getProviderOrSigner();
      // set useState to true
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * startPresale: launch presale - onlyOwner modifier in contract - only owner can start presale
   */
  const startPresale = async () => {
    try {
      // get signer to write
      const signer = await getProviderOrSigner(true);
      // create new instance of contract with signer
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call startPresale
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      // set presale started to true
      await checkIfPresaleStarted(); // function defined below
    } catch (err) {
      console.error(err);
    }
  };

  /** 
   * checkIfPresaleStarted: checks if the presale has started by querying the 'presaleStarted' variable in contract 
  */
  const checkIfPresaleStarted = async () => {
    try {
      // only need provider to read
      const provider = await getProviderOrSigner();
      // create read-only instance of contract with provider
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner(); //defined below
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * checkIfPresaleEnded same as above function but with presaleEnded in contract
   */
  const checkIfPresaleEnded = async () => {
    try {
      // only need provider
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleEnded = await nftContract.presaleEnded();
      // presale ended is a timestamp which is a big number, so useing the lt(less than function) instead of '<'
      // Date.now()/1000 returns the current time in seconds
      // compare if _presaleEnded timestamp is less that the current time , meaning the presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /** 
   * getOwner calls the contract to retrieve the owner 
  */
  const getOwner = async () => {
    try {
      // get provider to read only
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call owner function from contract
      const _owner = await nftContract.owner();
      // get signer now to extract address of the currently connected MM wallet
      const signer = await getProviderOrSigner(true);
      // get address associatef to signer
      const address = await signer.getAddress();
      if (address.toLowerCase() == _owner.toLowerCase()) { // check if signer is owner - addresses not case-sensitive
        setIsOwner(true); 
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * getTokenIdsMinted: get number of tokens minted
   */
  const getTokenIdsMinted = async () => {
    try {
      // get provider
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _tokenIds = await nftContract.tokenIds();
      // _tokenIds is a Big Number - convert to string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * provider -  wallet read only connection with contract
   * signer - wallet read/write connection with contract
   */
  const getProviderOrSigner =  async (needSigner = false) => {
    // connect to MM
    // since web3Modal is stored as a reference, need to access current value to access underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider); //get provider

    // error if user not connected to correct network (rinkeby)
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4 ) {
      window.alert("Change network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }
    // if input is true, get signer and return signer
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer
    }
    return web3Provider; // else return provider
  }
  
  //useEffects are used to react to changes in state of website
  // array at end of function represents what state changes will trigger this effect
  // in this case, whenever 'walletConnected' changes - this effect will be called
  useEffect(() => {
    // if wallet not connected, create a new instance of web3Modal and connect wallet
    if (!walletConnected) {
      // assign Web3modal class to reference object by setting current value
      // current value is persisted as page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      //check if presale has started or ended
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      //set interval every 5 seconds to check if presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // set interval to get number of tokenIds minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  /*
  renderButton: returns a button based on state of dapp
  */
  const renderButton = () => {
    // if wallet is not connected, return a button which allows to connect wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    //if currently waiting, return loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    //if connected user is owner and presale hasnt started yet, then return button to start presale
    if (isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
    }
    // if connected user is not owner and presale hasnt started yet
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started</div> 
        </div>
      );
    }
    // presale started but hasnt ended, allow for WL minting
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started! If your address is whitelisted, You can mint a Crypto Dev!
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Mint Now!
          </button>
        </div>
      );
    }

    //if presale ended, public mint is available
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public: Mint Now!
        </button>
      );
    }
  };
  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}