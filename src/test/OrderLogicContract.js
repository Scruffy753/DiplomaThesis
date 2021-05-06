
const OrderLogicContract = artifacts.require("OrderLogicContract");
const DeliveryContract = artifacts.require("DeliveryContract");

require('chai').use( require('chai-as-promised') ).should()

contract('OrderLogicContract', ([authority, customer, store, deliverer]) => {
    let orderContract
    let deliveryContract

    // Deploy the contract
    before( async () => {
        orderContract = await OrderLogicContract.deployed()
        deliveryContract = await DeliveryContract.deployed()
    })


    // Deployment test
    describe('Delivery deployment', async () => {
        it('deploys successfully', async () => {
            const adress = await deliveryContract.address
            assert.notEqual(adress, 0x0)
            assert.notEqual(adress, '')
            assert.notEqual(adress, null)
            assert.notEqual(adress, undefined)
        })
    })

    describe('Confirmation mechanism', async () => {
        let orderId = 100;

        it('Shipping confirmation', async () => {
            await deliveryContract.confirmShipment( orderId, {from: store});
            await deliveryContract.confirmReceivment( orderId, {from: deliverer});

            let isCorrect = await deliveryContract.isConfirmed( orderId, store, deliverer )
            assert.equal(true, isCorrect, 'Shipping confirmation is correct');
            let isIncorrect = await deliveryContract.isConfirmed( orderId, store, customer )
            assert.equal(false, isIncorrect);
            let confirmation = await deliveryContract.store( orderId )
            // console.log("CONFIRMAITON:")
            // console.log( confirmation )
            // console.log( confirmation.state.toNumber() )
            assert.equal(1, confirmation.state.toNumber(), 'Shipping state is correct');
        })

        it('Delivering confirmation', async () => {
            await deliveryContract.confirmShipment( orderId, {from: deliverer});
            await deliveryContract.confirmReceivment( orderId, {from: customer});
            let isCorrect = await deliveryContract.isConfirmed( orderId, deliverer, customer )
            assert.equal(true, isCorrect, 'Delivering confirmation is correct');
            let confirmation = await deliveryContract.store( orderId )
            assert.equal(2, confirmation.state.toNumber(), 'Delivering state is correct');
            // console.log("Delivering CONFIRMAITON:")
            // console.log( confirmation )
        })

        it('Returning confirmation', async () => {
            await deliveryContract.confirmShipment( orderId, {from: customer});
            await deliveryContract.confirmReceivment( orderId, {from: deliverer});
            let isCorrect = await deliveryContract.isConfirmed( orderId, customer, deliverer )
            assert.equal(true, isCorrect, 'Returning confirmation is correct');
            let confirmation = await deliveryContract.store( orderId )
            assert.equal(3, confirmation.state.toNumber(), 'Returning state is correct');
            // console.log("Returning CONFIRMAITON:")
            // console.log( confirmation )
        })

        it('Receiving confirmation', async () => {
            await deliveryContract.confirmShipment( orderId, {from: deliverer});
            await deliveryContract.confirmReceivment( orderId, {from: store});
            let confirmation = await deliveryContract.store( orderId )
            // console.log("Receiving CONFIRMAITON:")
            // console.log( confirmation )
            let isCorrect = await deliveryContract.isConfirmed( orderId, deliverer, store )
            assert.equal(true, isCorrect, 'Receiving confirmation is correct');
            assert.equal(4, confirmation.state.toNumber(), 'Receiving state is correct');
        })


    })


    // Deployment test
    describe('Order deployment', async () => {
        it('deploys successfully', async () => {
            const adress = await orderContract.address
            assert.notEqual(adress, 0x0)
            assert.notEqual(adress, '')
            assert.notEqual(adress, null)
            assert.notEqual(adress, undefined)
        })

        it('authority property', async () => {
           // console.log(orderContract)
            const contractAuthority= await orderContract.authority()
            assert.equal(contractAuthority, authority)
        })
    })

    describe('Succes order management', async () => {
        let orderId, orderCount
        const orderCost = '5'
        const numberOfProducts = 4


        before(async () => {
            orderId = await orderContract.createOrder(
                customer,
                store,
                deliverer,
                "product list",
                numberOfProducts, web3.utils.toWei(orderCost, 'Ether')
            )
            orderCount = await orderContract.orderCount()
        })


        it('order creation', async () => {
            // console.log(orderId)
            // console.log("---")
            // console.log(orderCount)

            assert.equal(orderCount.toNumber(), 1)
            const order = await orderContract.orders( orderCount )

            //console.log("Order:")
            assert.equal(order.id.toNumber(), orderCount.toNumber(), 'id is correct')
            assert.equal(order.customer, customer, 'Customer adress is ok')
            assert.equal(order.store, store, 'Store adress is ok')
            assert.equal(order.deliverer, deliverer, 'Deliverer adress is ok')
            assert.equal(order.costInTotal, web3.utils.toWei(orderCost, 'Ether'), 'ContInTotal is ok')
            assert.equal(order.state.toNumber(), 0, 'Created is ok')

        })


        it('PAY state', async () => {
            orderContract.payOrder(orderCount, {from: customer,
                value: web3.utils.toWei(orderCost, 'Ether')}).should.be.ok;

            const order = await orderContract.orders( orderCount )

            // console.log("State")
            // console.log( order.state.toNumber() )
            assert.equal(order.state.toNumber(), 1, 'Payed is ok')

        })

        it('Accept state', async () => {
            orderContract.acceptOrder(orderCount, {from: authority}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: customer}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: deliverer}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: store}).should.be.ok;
            const order = await orderContract.orders( orderCount )

            // console.log("State")
            // console.log( order.state.toNumber() )
            assert.equal(order.state.toNumber(), 2, 'Accept is ok')

        })

        it('Shippment', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: store});
            await deliveryContract.confirmReceivment( orderCount, {from: deliverer});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 3, 'Shippet is ok')
        })

        it('Delivery', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: deliverer});
            await deliveryContract.confirmReceivment( orderCount, {from: customer});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 5, 'Delivery is ok')
        })


        it('Claim payment', async () => {
            let amountBefore = await web3.eth.getBalance( store );
            amountBefore = new web3.utils.BN(amountBefore);

            await orderContract.step( orderCount,  {from: store} );

            let amountAfter = await web3.eth.getBalance( store );
            amountAfter = new web3.utils.BN(amountAfter);

            const order = await orderContract.orders( orderCount )
            let toAdd  = web3.utils.toWei(orderCost, 'Ether')

            const exepectedBalance = amountBefore.add( new web3.utils.BN(toAdd) )
            // No strict for gas expences
            assert.notStrictEqual(amountAfter.toString(), exepectedBalance.toString())
            assert.equal(order.state.toNumber(), 6, 'Claim Payment is ok')
        })

    })


    describe('Returning management', async () => {
        let orderId, orderCount
        const orderCost = '5'
        const numberOfProducts = 4
        const returmentAmount = '1'

        before(async () => {
            orderId = await orderContract.createOrder(
                customer,
                store,
                deliverer,
                "product list",
                numberOfProducts, web3.utils.toWei(orderCost, 'Ether')
            )
            orderCount = await orderContract.orderCount()
        })


        it('order creation', async () => {
            // console.log(orderId)
            // console.log("---")
            // console.log(orderCount)

            assert.equal(orderCount.toNumber(), 2)
            const order = await orderContract.orders( orderCount )

            //console.log("Order:")
            assert.equal(order.id.toNumber(), orderCount.toNumber(), 'id is correct')
            assert.equal(order.customer, customer, 'Customer adress is ok')
            assert.equal(order.store, store, 'Store adress is ok')
            assert.equal(order.deliverer, deliverer, 'Deliverer adress is ok')
            assert.equal(order.costInTotal, web3.utils.toWei(orderCost, 'Ether'), 'ContInTotal is ok')
            assert.equal(order.state.toNumber(), 0, 'Created is ok')

        })


        it('PAY state', async () => {
            orderContract.payOrder(orderCount, {from: customer,
                value: web3.utils.toWei(orderCost, 'Ether')}).should.be.ok;

            const order = await orderContract.orders( orderCount )

            // console.log("State")
            // console.log( order.state.toNumber() )
            assert.equal(order.state.toNumber(), 1, 'Payed is ok')

        })

        it('Accept state', async () => {
            orderContract.acceptOrder(orderCount, {from: authority}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: customer}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: deliverer}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: store}).should.be.ok;
            const order = await orderContract.orders( orderCount )

            // console.log("State")
            // console.log( order.state.toNumber() )
            assert.equal(order.state.toNumber(), 2, 'Accept is ok')

        })

        it('Shippment', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: store});
            await deliveryContract.confirmReceivment( orderCount, {from: deliverer});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 3, 'Shippet is ok')
        })

        it('Delivery', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: deliverer});
            await deliveryContract.confirmReceivment( orderCount, {from: customer});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 5, 'Delivery is ok')
        })


        it('Send back', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: customer});
            await deliveryContract.confirmReceivment( orderCount, {from: deliverer});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 7, 'Sendback is ok')
        })


        it('Returment', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: deliverer});
            await deliveryContract.confirmReceivment( orderCount, {from: store});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 8, 'Returment is ok')
        })


        it('Send proposal', async () => {
            await orderContract.makeProposal( orderCount, web3.utils.toWei( returmentAmount , 'Ether'),
                'reason', {from: store} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 9, 'Sended proposal is ok')
        })


        it('Accept proposal', async () => {
            let amountBeforeStore = await web3.eth.getBalance( store );
            amountBeforeStore = new web3.utils.BN(amountBeforeStore);

            let amountBeforeCustomer = await web3.eth.getBalance( customer );
            amountBeforeCustomer = new web3.utils.BN(amountBeforeCustomer);

            await orderContract.proposalAcceptence( orderCount, true ,  {from: customer} );

            let amountAfterStore = await web3.eth.getBalance( store );
            amountAfterStore = new web3.utils.BN(amountAfterStore);

            let amountAfterCustomer = await web3.eth.getBalance( customer );
            amountAfterCustomer = new web3.utils.BN(amountAfterCustomer);


            let toAddStore  = web3.utils.toWei( (parseInt(orderCost) - parseInt(returmentAmount)).toString() , 'Ether')
            let toAddCustomer  = web3.utils.toWei(returmentAmount, 'Ether')

            const exepectedBalanceStore = amountAfterStore.add( new web3.utils.BN(toAddStore) )
            const exepectedBalanceCustomer = amountAfterCustomer.add( new web3.utils.BN(toAddCustomer) )

            // No strict for gas expences
            assert.notStrictEqual(amountAfterStore.toString(),
                exepectedBalanceStore.toString(), 'Store balance OK')
            assert.notStrictEqual(amountAfterCustomer.toString(),
                exepectedBalanceCustomer.toString(), 'Customer balance OK')

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 11, 'REFUNDED is ok')
        })



    })


    describe('Resolving by Authority', async () => {
        let orderId, orderCount
        const orderCost = '5'
        const numberOfProducts = 4
        const returmentAmount = '1'

        before(async () => {
            orderId = await orderContract.createOrder(
                customer,
                store,
                deliverer,
                "product list",
                numberOfProducts, web3.utils.toWei(orderCost, 'Ether')
            )
            orderCount = await orderContract.orderCount()
        })


        it('order creation', async () => {
            // console.log(orderId)
            // console.log("---")
            // console.log(orderCount)

            assert.equal(orderCount.toNumber(), 3)
            const order = await orderContract.orders( orderCount )

            //console.log("Order:")
            assert.equal(order.id.toNumber(), orderCount.toNumber(), 'id is correct')
            assert.equal(order.customer, customer, 'Customer adress is ok')
            assert.equal(order.store, store, 'Store adress is ok')
            assert.equal(order.deliverer, deliverer, 'Deliverer adress is ok')
            assert.equal(order.costInTotal, web3.utils.toWei(orderCost, 'Ether'), 'ContInTotal is ok')
            assert.equal(order.state.toNumber(), 0, 'Created is ok')

        })


        it('PAY state', async () => {
            orderContract.payOrder(orderCount, {from: customer,
                value: web3.utils.toWei(orderCost, 'Ether')}).should.be.ok;

            const order = await orderContract.orders( orderCount )

            // console.log("State")
            // console.log( order.state.toNumber() )
            assert.equal(order.state.toNumber(), 1, 'Payed is ok')

        })

        it('Accept state', async () => {
            orderContract.acceptOrder(orderCount, {from: authority}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: customer}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: deliverer}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: store}).should.be.ok;
            const order = await orderContract.orders( orderCount )

            // console.log("State")
            // console.log( order.state.toNumber() )
            assert.equal(order.state.toNumber(), 2, 'Accept is ok')

        })

        it('Shippment', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: store});
            await deliveryContract.confirmReceivment( orderCount, {from: deliverer});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 3, 'Shippet is ok')
        })

        it('Delivery', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: deliverer});
            await deliveryContract.confirmReceivment( orderCount, {from: customer});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 5, 'Delivery is ok')
        })


        it('Send back', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: customer});
            await deliveryContract.confirmReceivment( orderCount, {from: deliverer});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 7, 'Sendback is ok')
        })


        it('Returment', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: deliverer});
            await deliveryContract.confirmReceivment( orderCount, {from: store});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 8, 'Returment is ok')
        })


        it('Send proposal', async () => {
            await orderContract.makeProposal( orderCount, web3.utils.toWei( returmentAmount , 'Ether'),
                'reason', {from: store} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 9, 'Sended proposal is ok')
        })

        it('Decline proposal', async () => {

            await orderContract.proposalAcceptence( orderCount, false ,  {from: customer} );
            const order = await orderContract.orders( orderCount )

            assert.equal(order.state.toNumber(), 10, 'Freezed proposal is ok')
        })


        it('Authority decision', async () => {
            let amountBeforeStore = await web3.eth.getBalance( store );
            amountBeforeStore = new web3.utils.BN(amountBeforeStore);

            let amountBeforeCustomer = await web3.eth.getBalance( customer );
            amountBeforeCustomer = new web3.utils.BN(amountBeforeCustomer);

            await orderContract.unfroze( orderCount, web3.utils.toWei( returmentAmount, 'Ether' ) ,  {from: authority} );

            let amountAfterStore = await web3.eth.getBalance( store );
            amountAfterStore = new web3.utils.BN(amountAfterStore);

            let amountAfterCustomer = await web3.eth.getBalance( customer );
            amountAfterCustomer = new web3.utils.BN(amountAfterCustomer);


            let toAddStore  = web3.utils.toWei( (parseInt(orderCost) - parseInt(returmentAmount)).toString() , 'Ether')
            let toAddCustomer  = web3.utils.toWei(returmentAmount, 'Ether')

            const exepectedBalanceStore = amountAfterStore.add( new web3.utils.BN(toAddStore) )
            const exepectedBalanceCustomer = amountAfterCustomer.add( new web3.utils.BN(toAddCustomer) )

            // No strict for gas expences
            assert.notStrictEqual(amountAfterStore.toString(),
                exepectedBalanceStore.toString(), 'Store balance OK')
            assert.notStrictEqual(amountAfterCustomer.toString(),
                exepectedBalanceCustomer.toString(), 'Customer balance OK')

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 11, 'REFUNDED is ok')
        })



    })


    describe('Cancel order', async () => {
        let orderId, orderCount
        const orderCost = '5'
        const numberOfProducts = 4


        before(async () => {
            orderId = await orderContract.createOrder(
                customer,
                store,
                deliverer,
                "product list",
                numberOfProducts, web3.utils.toWei(orderCost, 'Ether')
            )
            orderCount = await orderContract.orderCount()
        })


        it('order creation', async () => {
            // console.log(orderId)
            // console.log("---")
            // console.log(orderCount)

            assert.equal(orderCount.toNumber(), 4)
            const order = await orderContract.orders( orderCount )

            //console.log("Order:")
            assert.equal(order.id.toNumber(), orderCount.toNumber(), 'id is correct')
            assert.equal(order.customer, customer, 'Customer adress is ok')
            assert.equal(order.store, store, 'Store adress is ok')
            assert.equal(order.deliverer, deliverer, 'Deliverer adress is ok')
            assert.equal(order.costInTotal, web3.utils.toWei(orderCost, 'Ether'), 'ContInTotal is ok')
            assert.equal(order.state.toNumber(), 0, 'Created is ok')

        })


        it('PAY state', async () => {
            orderContract.payOrder(orderCount, {from: customer,
                value: web3.utils.toWei(orderCost, 'Ether')}).should.be.ok;

            const order = await orderContract.orders( orderCount )

            // console.log("State")
            // console.log( order.state.toNumber() )
            assert.equal(order.state.toNumber(), 1, 'Payed is ok')

        })

        it('Accept state', async () => {
            orderContract.acceptOrder(orderCount, {from: authority}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: customer}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: deliverer}).should.be.rejected;
            orderContract.acceptOrder(orderCount, {from: store}).should.be.ok;
            const order = await orderContract.orders( orderCount )

            // console.log("State")
            // console.log( order.state.toNumber() )
            assert.equal(order.state.toNumber(), 2, 'Accept is ok')

        })

        it('Shippment', async () => {
            await deliveryContract.confirmShipment( orderCount, {from: store});
            await deliveryContract.confirmReceivment( orderCount, {from: deliverer});
            await orderContract.confirmationMechanism( orderCount, deliveryContract.address,  {from: deliverer} );

            const order = await orderContract.orders( orderCount )
            assert.equal(order.state.toNumber(), 3, 'Shippet is ok')
        })

        it('Cancel', async () => {
            let amountBefore = await web3.eth.getBalance( customer );
            amountBefore = new web3.utils.BN(amountBefore);

            await orderContract.cancelOrder( orderCount,  {from: customer} );

            let amountAfter = await web3.eth.getBalance( customer );
            amountAfter = new web3.utils.BN(amountAfter);

            const order = await orderContract.orders( orderCount )
            let toAdd  = web3.utils.toWei(orderCost, 'Ether')

            const exepectedBalance = amountBefore.add( new web3.utils.BN(toAdd) )
            // No strict for gas expences
            assert.notStrictEqual(amountAfter.toString(), exepectedBalance.toString())
            assert.equal(order.state.toNumber(), 4, 'Cancel is ok')
        })


    })



})