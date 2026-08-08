// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract BountyChain {
/// ==== EVENTS ===///
event UserRegistered(
    address indexed user,
    Role role
);
event BountyCreated(
    uint indexed bountyId,
    address indexed client,
    uint budget
);
event BidPlaced(
    uint indexed bountyId,
    address indexed freelancer,
    uint amount
);
event BidSelected(
    uint indexed bountyId,
    address indexed freelancer,
    uint amount
);
event WorkSubmitted(
    uint indexed bountyId,
    address indexed freelancer,
    string ipfsHash
);
event WorkApproved(
    uint indexed bountyId,
    address indexed freelancer
);
event DisputeRaised(
    uint indexed bountyId,
    address indexed arbiter
);
event DisputeResolved(
    uint indexed bountyId,
    address indexed arbiter
);
event Withdrawal(
    address indexed user,
    uint amount
);



///=== User Register ===///
    enum Role { Arbiter, client, Freelancer}
    struct user {
        string name;
        Role role;
        string ipfsAvatarHash;
        int reputation;
        bool isRegistered;
    }
    mapping (address => user) public users;
    address[] public arbiters;
    mapping(address => uint) public withdrawableBalance;

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
                }else if (_role == Role.Arbiter){
                    require(arbiters.length == 0, "Arbiter already registered");
                    users[msg.sender].name = _name;
                    users[msg.sender].role = _role;
                    users[msg.sender].ipfsAvatarHash = _ipfsAvatarHash;
                    users[msg.sender].reputation = 0;
                    users[msg.sender].isRegistered = true;
                    arbiters.push(msg.sender);
                }else{
                    users[msg.sender].name = _name;
                    users[msg.sender].role = _role;
                    users[msg.sender].ipfsAvatarHash = _ipfsAvatarHash;
                    users[msg.sender].reputation = 0;
                    users[msg.sender].isRegistered = true;
                }
                emit UserRegistered(msg.sender, _role);
            }
            
        }
    function getUser(address _address) view public returns(user memory){
        return users[_address];
    }
    function getArbiters() public view returns(address[] memory) {
    return arbiters;
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

        address assignedArbiter;

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
                emit BountyCreated(bountyCount, msg.sender, _maxBudget);
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
                emit BidPlaced(_bountyId, msg.sender, _bidAmount);
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
                    (bool success, ) = payable(msg.sender).call{value: refund}("");
                    require(success, "Refund failed");
                }

                bounties[_bountyId].escrowAmount = bounties[_bountyId].bidAmount;
                bounties[_bountyId].status = BountyStatus.Locked;
                emit BidSelected(_bountyId, bounties[_bountyId].selectedFreelancer, bounties[_bountyId].bidAmount);
            }
        }else {
            revert("User not registered or not a client");
        }
    }

/// === Work Submission === ///


    function submitWork(uint _bountyId, string memory _ipfsWorkFileHash) public {
        if (users[msg.sender].isRegistered == true && users[msg.sender].role == Role.Freelancer) {
            if (bounties[_bountyId].status != BountyStatus.Locked) {
                revert("Bounty is not locked for work submission");
            }
            if (bounties[_bountyId].workSubmitted) {
                revert("Work has already been submitted for this bounty");
            }
            if (bounties[_bountyId].selectedFreelancer != msg.sender) {
                revert("Only the selected freelancer can submit work");
            }else{
                bounties[_bountyId].ipfsWorkFileHash = _ipfsWorkFileHash;
                emit WorkSubmitted(_bountyId, msg.sender, _ipfsWorkFileHash);
                bounties[_bountyId].workSubmitted = true;
            }
        }else {
            revert("User not registered or not a freelancer");
        }
    }

/// === Dispute === /// 
function disputeWork(
    uint _bountyId,
    address _arbiter
    ) public {

        if (!users[msg.sender].isRegistered ||
            users[msg.sender].role != Role.client) {
            revert("Only registered clients can dispute");
        }

        if (bounties[_bountyId].client != msg.sender) {
            revert("Not your bounty");
        }

        if (bounties[_bountyId].status != BountyStatus.Locked) {
            revert("Bounty is not locked");
        }

        if (!users[_arbiter].isRegistered ||
            users[_arbiter].role != Role.Arbiter) {
            revert("Invalid arbiter");
        }

        emit DisputeRaised(_bountyId, _arbiter);

        bounties[_bountyId].assignedArbiter = _arbiter;
        bounties[_bountyId].status = BountyStatus.Disputed;
    }

function getMyDisputes()
    public
    view
    returns(uint[] memory)
    {
        uint count = 0;

        for(uint i = 0; i < bountyCount; i++) {
            if(
                bounties[i].assignedArbiter == msg.sender &&
                bounties[i].status == BountyStatus.Disputed
            ){
                count++;
            }
        }

        uint[] memory myDisputes = new uint[](count);

        uint index = 0;

        for(uint i = 0; i < bountyCount; i++) {
            if(
                bounties[i].assignedArbiter == msg.sender &&
                bounties[i].status == BountyStatus.Disputed
            ){
                myDisputes[index] = i;
                index++;
            }
        }

        return myDisputes;
    }

/// === Approve Work By Client=== ///
function approveWork(uint _bountyId) public {
    if(msg.sender != bounties[_bountyId].client){
        revert("Not the client");
    }
    if(!bounties[_bountyId].workSubmitted){
        revert("Work not submitted yet");
    }
    require(arbiters.length > 0, "No arbiter registered"); 
    uint fee = (bounties[_bountyId].escrowAmount * 2) / 100;
    uint payout = bounties[_bountyId].escrowAmount - fee;

    withdrawableBalance[bounties[_bountyId].selectedFreelancer] += payout;
    withdrawableBalance[arbiters[0]] += fee; 

    users[bounties[_bountyId].selectedFreelancer].reputation += 15;
    bounties[_bountyId].status = BountyStatus.Resolved;
    emit WorkApproved(_bountyId, bounties[_bountyId].selectedFreelancer);
}

/// === Resolve === ///

/// === Approve Freelancer === ///
function approveFreelancer(uint _bountyId) public {

    if(msg.sender != bounties[_bountyId].assignedArbiter){
        revert("Not assigned arbiter");
    }
    if(!bounties[_bountyId].workSubmitted){
        revert("Work not submitted yet");
    }

    uint fee =
        (bounties[_bountyId].escrowAmount * 2) / 100;

    uint payout =
        bounties[_bountyId].escrowAmount - fee;

    withdrawableBalance[
        bounties[_bountyId].selectedFreelancer
    ] += payout;

    withdrawableBalance[msg.sender] += fee;

    users[
        bounties[_bountyId].selectedFreelancer
    ].reputation += 15;

    bounties[_bountyId].status =
        BountyStatus.Resolved;
    emit DisputeResolved(_bountyId, msg.sender);
}

/// === Refund Client === ///
function refundClient(uint _bountyId) public {

    if(msg.sender != bounties[_bountyId].assignedArbiter){
        revert("Not assigned arbiter");
    }

    withdrawableBalance[
        bounties[_bountyId].client
    ] += bounties[_bountyId].escrowAmount;

    bounties[_bountyId].status =
        BountyStatus.Resolved;
    
    bounties[_bountyId].escrowAmount = 0;
    users[
        bounties[_bountyId].selectedFreelancer
    ].reputation -= 30;
    emit DisputeResolved(_bountyId, msg.sender);
}

/// === Withdraw === ///
    function withdraw() public {
        uint amount = withdrawableBalance[msg.sender];
        if(amount == 0){
            revert("No funds to withdraw");
        }
        withdrawableBalance[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        emit Withdrawal(msg.sender, amount);
    }
}