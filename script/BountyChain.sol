// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract BountyChain {

///=== User Register ===///
    enum Role { Arbiter, client, Freelancer}
    struct user {
        string name;
        Role role;
        string ipfsAvatarHash;
        uint reputation;
        bool isRegistered;
    }
    mapping (address => user) public users;

    function setUser(
        string memory _name, 
        Role _role, 
        string memory _ipfsAvatarHash
        ) public {
            if(users[msg.sender].isRegistered == true){
                revert("User Already Exists");
            }else{
                if(_role == Role.Freelancer){
                    users[msg.sender].name = _name;
                    users[msg.sender].role = _role;
                    users[msg.sender].ipfsAvatarHash = _ipfsAvatarHash;
                    users[msg.sender].reputation = 100;
                    users[msg.sender].isRegistered = true; 
                }else{
                    users[msg.sender].name = _name;
                    users[msg.sender].role = _role;
                    users[msg.sender].ipfsAvatarHash = _ipfsAvatarHash;
                    users[msg.sender].reputation = 0;
                    users[msg.sender].isRegistered = true;
                }
            }
            
        }
    function getUser(address _address) view public returns(user memory){
        return users[_address];
    }

/// === Bounty === ///
    enum BountyStatus { Open, Locked, Disputed, Resolved }
    struct bounty {
        string ipfsBountyDetailsHash;
        uint maxBudget;
        address client;
        BountyStatus status;

        address selectedFreelancer;
        uint bidAmount;
        uint escrowAmount;

        string ipfsWorkFileHash;
        bool workSubmitted;

    }
    mapping (uint => bounty) public bounties;
    uint public bountyCount;
    
    function createBounty(
        string memory _ipfsBountyDetailsHash,
        uint _maxBudget
    ) public {
        if (users[msg.sender].isRegistered == true && users[msg.sender].role == Role.client ) {
            if (_maxBudget <= 0) {
                revert("Max budget must be greater than zero");
            }else{
                bounties[bountyCount].ipfsBountyDetailsHash = _ipfsBountyDetailsHash;
                bounties[bountyCount].maxBudget = _maxBudget;
                bounties[bountyCount].client = msg.sender;
                bounties[bountyCount].status = BountyStatus.Open;
                bountyCount++;
            }
        }else {
            revert("User not registered or not a client");
        }
    }

/// === Bid === ///

    struct bid{
        address freelancer;
        uint bidAmount;
    }
    mapping (uint => bid[]) public bids;

    function createBid (
        uint _bountyId,
        uint _bidAmount
    ) public {
        if (users[msg.sender].isRegistered == true && users[msg.sender].role == Role.Freelancer && users[msg.sender].reputation >= 40) {
            if (bounties[_bountyId].status != BountyStatus.Open) {
                revert("Bounty is not open for bidding");
            }
            if (_bidAmount <= 0 || _bidAmount > bounties[_bountyId].maxBudget) {
                revert("Bid amount must be greater than zero and must not be more then the max budget");
            }else{
                bids[_bountyId].push(bid({
                    freelancer: msg.sender,
                    bidAmount: _bidAmount
                }));
            }
        }else {
            revert("User not registered or not a freelancer or reputation too low");
        }
    }

/// === Bid Selection & Escrow Fund === ///
    function selectBid(uint _bountyId, uint _bidIndex) public payable {
        if (users[msg.sender].isRegistered == true && users[msg.sender].role == Role.client) {
            if (bounties[_bountyId].status != BountyStatus.Open) {
                revert("Bounty is not open for bid selection");
            }
            if (bounties[_bountyId].client != msg.sender) {
                revert("Only the client who created the bounty can select a bid");
            }
            if (bids[_bountyId].length <= _bidIndex) {
                revert("Invalid bid index");
            }else{
                bounties[_bountyId].selectedFreelancer = bids[_bountyId][_bidIndex].freelancer;
                bounties[_bountyId].bidAmount = bids[_bountyId][_bidIndex].bidAmount;
                if (msg.value < bounties[_bountyId].bidAmount) {
                    revert("Insufficient escrow amount");
                }
                uint refund = msg.value - bounties[_bountyId].bidAmount;

                if (refund > 0) {
                    payable(msg.sender).transfer(refund);
                }

                bounties[_bountyId].escrowAmount = bounties[_bountyId].bidAmount;
                bounties[_bountyId].status = BountyStatus.Locked;
                
            }
        }else {
            revert("User not registered or not a client");
        }
    }
}
