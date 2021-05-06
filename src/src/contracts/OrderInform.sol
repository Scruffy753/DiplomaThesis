pragma solidity ^0.8.0;

contract OrderInform {
    // Authorities
    address public authority;

    // key:value store
    uint  public orderCount = 0;
    mapping(uint => Order) public orders;

    mapping(uint => ConfirmationMechanism) public storeShipnent;
    mapping(uint => ConfirmationMechanism) public customerRecievement;
    mapping(uint => ConfirmationMechanism) public customerShipment;
    mapping(uint => ConfirmationMechanism) public storeRecievement;
    mapping(uint => Settlement) public settlements;

    mapping(address => uint) public adressOrder;

    // STRUCTS

    struct Order {
        // identificator of the order
        uint id;

        // roles
        address payable customer;
        address payable store;
        address deliverer;
        //
        uint costInTotal;
        int256 acceptedDate;

        //
        uint productListHash;
        uint returnedProductListHash;
        uint returnedListHash;
        uint customerInformationHash;


        // State
        OrderState state;
    }

    enum OrderState{
        CREATED,
        PAID,
        ACCEPTED,
        SHIPPED,
        CANCELLED,
        DELIVERED,
        COMPLETED,
        SENTBACK,
        RETURNED,
        PROPOSALFORSETTLEMENT,
        FROZEN,
        REFUNDED
    }

    struct ConfirmationMechanism{
        address condignor;
        address recipient;
        uint256  consignorConfimraiton; // timestamp
        uint256  recipientConfimraiton; // timestamp
        bool exists;  // workaround
    }

    struct Settlement{
        uint refundedAmount;
        string reason;
        bool accepted;
        uint decicedRefundAmount;
        bool exists;  // workaround
    }

    constructor() public {
        authority = msg.sender;
    }
    // EVENTS
    event ConfirmaionStateChanged(
        uint orderId,
        OrderState state
    );

    function confirm(uint  _orderId ) public{
        // Make sure the id is valid
        require(_orderId > 0 && _orderId <= orderCount);
        // Fetch the order
        Order memory _order = orders[_orderId];
    }

//    function confirmShipment(uint _orderId) public {
//        // Make sure the id is valid
//        require(_orderId > 0 && _orderId <= orderCount);
//        // Fetch the order
//        Order memory _order = orders[_orderId];
//
//        require(
//            ( _order.state == OrderState.ACCEPTED && msg.sender == _order.store )       ||
//            ( _order.state == OrderState.SHIPPED && msg.sender == _order.deliverer)     ||
//            ( _order.state == OrderState.COMPLETED && msg.sender == _order.customer )   ||
//            ( _order.state == OrderState.SENTBACK && msg.sender == _order.deliverer ));
//
//        // Test existence og confirmation mechanism
//        if ( _order.state == OrderState.ACCEPTED && msg.sender == _order.store ){
//            if (storeShipnent[_orderId].exists){ // not created
//                storeShipnent[_orderId] = ConfirmationMechanism( msg.sender, address(0), block.number, 0 , true);
//            }else{
//                ConfirmationMechanism storage conf = storeShipnent[_orderId];
//                conf.condignor = msg.sender;
//                conf.consignorConfimraiton = block.number;
//                storeShipnent[_orderId] = conf;
//                _order.state = OrderState.SHIPPED;
//                orders[_orderId] = _order;
//            }
//        }else if ( _order.state == OrderState.SHIPPED && msg.sender == _order.deliverer){
//            if (customerRecievement[_orderId].exists ){ // not created
//                customerRecievement[_orderId] = ConfirmationMechanism( msg.sender, address(0), block.number, 0 , true);
//            }else{
//                ConfirmationMechanism storage conf = customerRecievement[_orderId];
//                conf.condignor = msg.sender;
//                conf.consignorConfimraiton = block.number;
//                customerRecievement[_orderId] = conf;
//                _order.state = OrderState.DELIVERED;
//                orders[_orderId] = _order;
//            }
//        }else if ( _order.state == OrderState.COMPLETED && msg.sender == _order.customer ){
//            if (customerShipment[_orderId].exists  ){ // not created
//                customerShipment[_orderId] = ConfirmationMechanism( msg.sender, address(0), block.number, 0 , true);
//            }else{
//                ConfirmationMechanism storage conf = customerShipment[_orderId];
//                conf.condignor = msg.sender;
//                conf.consignorConfimraiton = block.number;
//                customerShipment[_orderId] = conf;
//                _order.state = OrderState.SENTBACK;
//                orders[_orderId] = _order;
//            }
//        }else if ( _order.state == OrderState.SENTBACK && msg.sender == _order.deliverer ){
//            if (storeRecievement[_orderId].exists ){ // not created
//                storeRecievement[_orderId] = ConfirmationMechanism( msg.sender, address(0), block.number, 0, true );
//            }else{
//                ConfirmationMechanism storage conf = storeRecievement[_orderId];
//                conf.condignor = msg.sender;
//                conf.consignorConfimraiton = block.number;
//                storeRecievement[_orderId] = conf;
//                _order.state = OrderState.RETURNED;
//                orders[_orderId] = _order;
//            }
//        }
//
//    }
//    //
//    function confirmtRecievment( uint _orderId ) public {
//
//        // Make sure the id is valid
//        require(_orderId > 0 && _orderId <= orderCount);
//        // Fetch the order
//        Order memory _order = orders[_orderId];
//
//        require(
//            ( _order.state == OrderState.ACCEPTED && msg.sender == _order.deliverer )       ||
//            ( _order.state == OrderState.SHIPPED && msg.sender == _order.customer)     ||
//            ( _order.state == OrderState.COMPLETED && msg.sender == _order.deliverer )   ||
//            ( _order.state == OrderState.SENTBACK && msg.sender == _order.store ));
//
//        // Test existence og confirmation mechanism
//        if ( _order.state == OrderState.ACCEPTED && msg.sender == _order.deliverer ){
//            if (storeShipnent[_orderId].exists){ // not created
//                storeShipnent[_orderId] = ConfirmationMechanism( address(0), msg.sender, 0, block.number, true);
//            }else{
//                ConfirmationMechanism storage conf = storeShipnent[_orderId];
//                conf.recipient = msg.sender;
//                conf.recipientConfimraiton = block.number;
//                storeShipnent[_orderId] = conf;
//                _order.state = OrderState.SHIPPED;
//                orders[_orderId] = _order;
//            }
//        }else if ( _order.state == OrderState.SHIPPED && msg.sender == _order.customer){
//            if (customerRecievement[_orderId].exists ){ // not created
//                customerRecievement[_orderId] = ConfirmationMechanism( address(0), msg.sender, 0, block.number, true);
//            }else{
//                ConfirmationMechanism storage conf = customerRecievement[_orderId];
//                conf.recipient = msg.sender;
//                conf.recipientConfimraiton = block.number;
//                customerRecievement[_orderId] = conf;
//                _order.state = OrderState.DELIVERED;
//                orders[_orderId] = _order;
//            }
//        }else if ( _order.state == OrderState.COMPLETED && msg.sender == _order.deliverer ){
//            if (customerShipment[_orderId].exists  ){ // not created
//                customerShipment[_orderId] = ConfirmationMechanism( address(0), msg.sender, 0, block.number, true);
//            }else{
//                ConfirmationMechanism storage conf = customerShipment[_orderId];
//                conf.recipient = msg.sender;
//                conf.recipientConfimraiton = block.number;
//                customerShipment[_orderId] = conf;
//                _order.state = OrderState.SENTBACK;
//                orders[_orderId] = _order;
//            }
//        }else if ( _order.state == OrderState.SENTBACK && msg.sender == _order.store ){
//            if (storeRecievement[_orderId].exists ){ // not created
//                storeRecievement[_orderId] = ConfirmationMechanism( address(0), msg.sender, 0, block.number, true);
//            }else{
//                ConfirmationMechanism storage conf = storeRecievement[_orderId];
//                conf.recipient = msg.sender;
//                conf.recipientConfimraiton = block.number;
//                storeRecievement[_orderId] = conf;
//                _order.state = OrderState.RETURNED;
//                orders[_orderId] = _order;
//            }
//        }
//
//    }

}
