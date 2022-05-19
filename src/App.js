import React, { useEffect, useState } from "react";
import "./App.css";
import SelectCharacter from "./Components/SelectCharacter";
import twitterLogo from "./assets/twitter-logo.svg";
import { CONTRACT_ADDRESS, transformCharacterData } from "./constants";
import myEpicGame from "./utils/MyEpicGame.json";
import { ethers } from "ethers";
import Arena from "./Components/Arena";
import LoadingIndicator from "./Components/LoadingIndicator";
// import SelectCharacter from './Components/SelectCharacter';

// Constants
const TWITTER_HANDLE = "CryptedO";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  // State
  const [currentAccount, setCurrentAccount] = useState(null);
  const [players, setPlayers] = useState(null);
  const [gameContract, setGameContract] = useState(null);
  /*
   * New state property added here
   */
  const [isLoading, setIsLoading] = useState(false);

  /*
   * Right under current account, setup this new state property
   */
  const [characterNFT, setCharacterNFT] = useState(null);
  // Actions
  const displayAddress=(address)=>{
    let fullAddress = address.toString();
    let str1 = fullAddress.slice(0,4);
    let str2 = fullAddress.slice(39);
    let display = str1 + "..." + str2;
    return display;
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        /*
         * We set isLoading here because we use return in the next line
         */
        setIsLoading(false);
        return;
      } else {
        console.log("We have the ethereum object", ethereum);

        const accounts = await ethereum.request({ method: "eth_accounts" });

        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account);
        } else {
          console.log("No authorized account found");
        }
      }
    } catch (error) {
      console.log(error);
    }
    /*
     * We release the state property after all the function logic
     */
    setIsLoading(false);
  };

  // Render Methods
  const renderContent = () => {
    /*
     * If the app is currently loading, just render out LoadingIndicator
     */
    if (isLoading) {
      return <LoadingIndicator />;
    }
    /*
     * Scenario #1
     */
    if (!currentAccount) {
      return (
        <div className="connect-wallet-container">
          <img src="https://i.imgur.com/TQsgyvR.gif" alt="Monty Python Gif" />
          {/*
           * Button that we will use to trigger wallet connect
           * Don't forget to add the onClick event to call your method!
           */}
          <button
            className="cta-button connect-wallet-button"
            onClick={connectWalletAction}
          >
            Connect Wallet To Get Started
          </button>
        </div>
      );
      /*
       * Scenario #2
       */
    } else if (currentAccount && !characterNFT) {
      return <SelectCharacter setCharacterNFT={setCharacterNFT} />;
    } else if (currentAccount && characterNFT) {
    /*
     * If there is a connected wallet and characterNFT, it's time to battle!
     */
      return (
        <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} />
      );
    }
  };

  
  /*
   * Implement your connectWallet method here
   */
  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // checkIfWalletIsConnected();
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );

      setGameContract(gameContract);
    }
    
    const checkNetwork = async () => {
      try {
        if (window.ethereum.networkVersion !== "4") {
          alert("Please connect to Rinkeby network!");
        }
      } catch (error) {
        console.log(error);
      }
    };
    
    
    /*
     * Anytime our component mounts, make sure to immiediately set our loading state
     */
    setIsLoading(true);
    checkNetwork();
    checkIfWalletIsConnected();
   
  }, []);

  useEffect(()=>{
    // 
    // fetch all players
    const getAllPlayers = async()=>{
      try {
        if(gameContract){
          const allPlayers = await gameContract.getListOfAllHolders();
          setPlayers(allPlayers);
          console.log("list of all players",allPlayers);
        }
      } catch (error) {
        console.log("coulden't fetch players ",error);
      }
    }

    getAllPlayers();
  },[gameContract])

  /*
   * Add this useEffect right under the other useEffect where you are calling checkIfWalletIsConnected
   */
  useEffect(() => {
    /*
     * The function we will call that interacts with out smart contract
     */
    const fetchNFTMetadata = async () => {
      console.log("Checking for Character NFT on address:", currentAccount);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );

      const txn = await gameContract.checkIfUserHasNFT();
      if (txn.name) {
        console.log("User has character NFT");
        setCharacterNFT(transformCharacterData(txn));
      } else {
        console.log("No character NFT found");
      }
      /*
       * Once we are done with all the fetching, set loading state to false
       */
      setIsLoading(false);
    };

    /*
     * We only want to run this, if we have a connected wallet
     */
    if (currentAccount) {
      console.log("CurrentAccount:", currentAccount);
      fetchNFTMetadata();
    }
  }, [currentAccount]);

  return (
    <div className="App">
      <div className="header-container">
        <p className="header gradient-text">&#9917; Defence Strikers &#9917;</p>
        <p className="sub-text">Team up to protect the Metaverse!</p>
        
      </div>

      <div className="container">
        
            <div className="players-list">
            <h4>Players</h4>
            
            {
              players?.map((player, index)=>(
                <p key={index} className="player">
                    {displayAddress(player.toString())}
                </p>
              ))
            }
        </div>
        

         <div className="strikers">
        {renderContent()}
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
        </div>
      </div>
    </div>
  );
};

export default App;
