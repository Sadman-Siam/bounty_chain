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
    }
    mapping (uint => bounty) public bounties;
    uint public bountyCount;
    
    function createBounty(
        string memory _ipfsBountyDetailsHash,
        uint _maxBudget
    ) public {
        if (users[msg.sender].isRegistered == true && users[msg.sender].role == Role.client) {
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

}