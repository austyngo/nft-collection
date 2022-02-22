// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    /**
    @dev _baseTokenURI for computing (tokenURI). If set, the resulting URI for each
    token will be the concatenation on 'baseURI' and 'tokenID'
    */
    string _baseTokenURI;

    // _price is price of NFT at mint
    uint256 public _price = 0.01 ether;

    // _paused is used to pause contract in case of emergency
    bool public _paused;

    // max number of tokens
    uint256 public maxTokenIds = 20;

    //total tokenIds minted
    uint256 public tokenIds;

    //whitelist contract instance
    IWhitelist whitelist;

    // bool to keep track of when presale started
    bool public presaleStarted;

    // timestamp for when presale ends
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }
    /**
    @dev ERC721 constructor takes in a 'name' and 'symbol' to token collection.
    'name' = 'Crypto Devs', symbol = 'CD' 
    Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection
    also initiates instance of whitelist interface
    */
    constructor (string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    } 

    /**
    @dev startPresale starts a presale for whitelisted addresses
    */
    function startPresale() public onlyOwner {
        presaleStarted = true;
        // set presaleEnded time as current timestamp + 5 min with solidity syntax
        presaleEnded = block.timestamp + 5 minutes;
    }

    /**
    @dev presaleMint allows user to mint one NFT per transaction during presale
    */
    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not active");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
        require(tokenIds < maxTokenIds, "Exceeded maximum Cryptp Devs supply");
        require(msg.value >= _price, "Not enough ether sent");
        tokenIds += 1;
        // _safeMint is safer verison of _mint
        // ensures that if address is being minted to is a contract, then it knows how to how to with ERC721 tokens
        // if address not a contract(eg. a wallet), it works the same as _mint
        _safeMint(msg.sender, tokenIds);
    }

    /**@dev mint allows user to mint 1 NFT per transaction after presale has ended
    */
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded, "Public mint not available yet");
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _price, "Not enough ether sent");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    /**
    @dev _baseURI overrides the OpenZeppelin's ERC721 implementaion, which by default
    returned and empty string for baseURI 
    */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
    @dev setPaused pauses or unpauses contract 
    */
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    /**
    @dev withdraw sends all th eether in the contract to owner of contract
    */

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    //function to receive Ether, msg.data must be empty
    receive() external payable {}

    //fallback function is called when msg.data is not empty
    fallback() external payable {}
}