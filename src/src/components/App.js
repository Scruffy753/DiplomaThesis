import React, { Component } from 'react';
import logo from '../logo.png';
import './App.css';
import Web3 from 'web3';
import OrderLogic from '../abis/OrderLogicContract.json';
import DeliveryContract from '../abis/DeliveryContract.json';

import { storeAPI } from '../StoreAPI';
import NonCreatedOrderTable from "./NonCreatedOrderTable";
import OrderInfo from "./OrderInfo";
import Actions from "./Actions";
import Product from "./Product";
import { OrderState, Role } from "./OrderState";
import { createHmac } from 'crypto';



class App extends Component {
  // Code

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
    await this.getOrder()

    this.watchOrderEvents()

    this.getDeliveryInfo()
    this.loadSellement()

  }


  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }


    async loadBlockchainData() {
      const web3 = window.web3
      // Load account
      const accounts = await web3.eth.getAccounts()
      this.setState({ account: accounts[0] })
      // Network ID
      const networkId = await web3.eth.net.getId()
      const networkData = OrderLogic.networks[networkId]
      console.log( "Network data" )
      console.log( networkData )
      if(networkData) {
        const orderLogic = new web3.eth.Contract(OrderLogic.abi, networkData.address)
        this.setState({ orderLogic })
        console.log( "Contract" )
        console.log( orderLogic );
        const orderCount = await orderLogic.methods.orderCount().call()
        console.log( "Order count" )
        console.log( orderCount )

      } else {
        window.alert('SocialNetwork contract not deployed to detected network.')
      }

      const networkDelivertData = DeliveryContract.networks[networkId]
      if(networkDelivertData) {
        const deliveryContract = new web3.eth.Contract(DeliveryContract.abi, networkDelivertData.address)
        this.setState({ deliveryContract })
      } else {
        window.alert('Delivery constract not deployed to detected network.')
      }




    }

    watchOrderEvents(){
      this.state.orderLogic.events.OrderStateChanged({})
          .on('data', event => {
            console.log("watchOrderEvents: Event catched")
            console.log(event)
            if ( this.state.order !== null ){ // fix for creating one
              if ( event.returnValues.orderId === this.state.order.id ){
                 this.getOrder()
              }
            }

          })
    }

    async getOrder(){
      if ( this.state.orderFromStoreInfo.id !== undefined ){

        const order = await this.state.orderLogic.methods.orders(this.state.orderFromStoreInfo.id).call()
        console.log( "Order" )
        console.log( order )
        this.setState({ order  : order })
        this.setState( { orderState : OrderState.getName(order.state) } )
        this.determineRole()
        this.watchOrderEvents()
        this.setState({ sended : false })


        if ( order.id !== "0" ){ // order is not created
          this.setState({ deployState : "DEPLOYED" })
        }
      }else{
        this.setState({ deployState : "NOTDEPLOYED" })
        console.log("Not deployed")
      }
    }

    determineRole(){
      switch (this.state.account){
        case this.state.order.customer: this.setState({ role: Role.CUSTOMER })
        break;
        case this.state.order.store: this.setState({ role: Role.STORE })
          break;
        case this.state.order.deliverer:this.setState({ role: Role.DELIVERER })
          break;
        default : this.setState({ role: Role.PUBLIC })
          break;
      }
    }


    // ORDER TRANSACTIONS

    async createOrder(){
      console.log( "Create order called" )
      console.log( storeAPI.getOrder() )
      let order = storeAPI.getOrder()
      console.log(this)

      this.state.orderLogic.methods.createOrder( this.state.account, storeAPI.storeAdress,
          order.delivererAddress, "45678907656789765",
          order.products.length, Web3.utils.toWei( order.cost.toString() , 'Ether') )
          .send({ from: this.state.account }).once( 'receipt', (receipt)  => {
            console.log("Order created")
            console.log(receipt)
            console.log("Order Events")
            console.log(receipt.events)
            console.log( "Id of created order: " )
            let id = receipt.events.OrderStateChanged.returnValues[0];
            console.log(receipt.events.OrderStateChanged.returnValues[0])
            let state = this.state.orderFromStoreInfo
            state.id = id
            this.setState({ orderFromStoreInfo : state })
            this.getOrder()
          }
      )
    }
  async payOrder(){

    this.state.orderLogic.methods.payOrder(this.state.order.id).send(
        { from:  this.state.account,
          value: Web3.utils.toWei( '5' , 'Ether') })
        .once( 'receipt', (receipt)  => {
          // code
          this.sendConfirmationToOrderContract(receipt)
        })
  }


  async acceptOrder(){
    this.state.orderLogic.methods.acceptOrder( this.state.order.id).send(
        {from: this.state.account}).once( 'receipt', (receipt)  => {
      // code
    })

  }


  async confirmShipment(){
    console.log(this.state.deliveryContract)
    console.log(this.state.deliveryContract.methods)
    console.log(this.state.deliveryContract.methods.confirmShipment)
    console.log("OrderID:" )

    console.log(this.state.order.id )


    this.state.deliveryContract.methods.confirmShipment( this.state.order.id ).send(
        {from: this.state.account}).once( 'receipt', (receipt)  => {
      // code
      this.setState({ sended : true })
      this.sendConfirmationToOrderContract(receipt)
    })
  }


  async confirmRecievment(){
    this.state.deliveryContract.methods.confirmReceivment( this.state.order.id ).send(
        {from: this.state.account}).once( 'receipt', (receipt)  => {
        // code
      this.setState({ sended : true })
      this.sendConfirmationToOrderContract(receipt)
    })
  }


  async sendConfirmationToOrderContract( receipt ){
    // Confirmation is completed
    console.log("sendConfirmationToOrderContract:")
    console.log( receipt.events )

    if ( receipt.events.ConfirmaionStateChanged !== undefined ){
       this.confirmationMechanismSend();

    }

  }


  async confirmationMechanismSend(){


      this.state.orderLogic.methods.confirmationMechanism(
          this.state.order.id ,
          this.state.deliveryContract._address ).send(
          {from: this.state.account}).once( 'receipt', (receipt)  => {
          // code

      })

  }

  async returnProducts(){
    this.state.orderLogic.methods.returnProducts(
        this.state.order.id,
        "producthash" ).send(
        {from: this.state.account}).once( 'receipt', (receipt)  => {
        // code
        this.setState({ returClick : true })
    })
  }

  async refund(){
    this.state.orderLogic.methods.refund(
        this.state.order.id ).send(
        {from: this.state.account}).once( 'receipt', (receipt)  => {
        // code


    })
  }

  handleSettlementReason( event ){
    console.log( "handleSettlementReason" )
    console.log(event.target.value)
  }

  handleSettlementAmount( event ){
    console.log( "handleSettlementAmount" )
    console.log(event.target.value)
  }

  async makeSettlement(){

    this.state.orderLogic.methods.makeProposal(
        this.state.order.id,
        Web3.utils.toWei( '1' , 'Ether'),
        'reason' ).send(
        {from: this.state.account}).once( 'receipt', (receipt)  => {
        // code
    })
  }

  async loadSellement(){
    if ( this.state.order !== null ){
      let settlement = storeAPI.getProposal( this.state.order.id )
      console.log( "Loaded settlement" )
    }
  }

  async settlementAccept(  ){
     this.sendSettlement( true )
  }

  async settlementDecline( ){
    this.sendSettlement( false )
  }



  async sendSettlement( decision ){
    this.state.orderLogic.methods.proposalAcceptence(
        this.state.order.id,
        decision
        ).send(
        {from: this.state.account}).once( 'receipt', (receipt)  => {
        // code

    })
  }

  async unfreeze( ){
    this.state.orderLogic.methods.unfroze(
        this.state.order.id,
        Web3.utils.toWei( '1' , 'Ether') // _amount
    ).send(
        {from: this.state.account}).once( 'receipt', (receipt)  => {
          // code

    })
  }

  // claim
  async step( ){
    this.state.orderLogic.methods.step(
        this.state.order.id
    ).send(
        {from: this.state.account}).once( 'receipt', (receipt)  => {
      // code

    })
  }

  async cancelOrder(){
    console.log(this)

    this.state.orderLogic.methods.cancelOrder(this.state.order.id).send(
        { from:  this.state.account })
        .once( 'receipt', (receipt)  => {
          // code

        })
  }

  // Delivery info
  async getDeliveryInfo(){
    if ( this.state.order !== null ){
    let deliveryInfo = await this.state.deliveryContract.methods.store( this.state.order.id ).call()
    console.log( "Delivery info" )
    console.log( deliveryInfo )
    }
  }



  // Callback from products
    callReturned(index){
      let tmp = this.state.orderFromStoreInfo
      tmp.products[index].returned = !tmp.products[index].returned
      console.log(tmp)
    }

    constructor(props) {
      super(props)

      this.state = {
        account: '',
        orderFromStoreInfo: null,
        orderLogic: null,
        order: null,
        postCount: 0,
        posts: [],
        storeInformation:{},
        loading: true,
        orderState: null,
        deployState: null,
        orderId: null,
        deliveryContract: null,
        // CUSTOMER, STORE, DELIVERER
        role: "",
        settlementReason : "Reason",
        settlementAmount: "1.0 ETH",
        sended: false,
        returClick: false,
        deliveryInfo: null
        //store: storeAPI
      }
      this.state.orderFromStoreInfo = storeAPI.getOrder()

      // Method binding for this
      this.createOrder = this.createOrder.bind(this)
      this.payOrder = this.payOrder.bind(this)
      this.cancelOrder = this.cancelOrder.bind(this)
      this.callReturned = this.callReturned.bind(this)
      this.confirmShipment = this.confirmShipment.bind(this)
      this.confirmRecievment = this.confirmRecievment.bind(this)
      this.sendConfirmationToOrderContract = this.sendConfirmationToOrderContract.bind(this)
      this.returnProducts = this.returnProducts.bind(this)
      this.makeSettlement = this.makeSettlement.bind(this)
      this.settlementAccept = this.settlementAccept.bind(this)
      this.sendSettlement = this.sendSettlement.bind(this)
      this.unfreeze = this.unfreeze.bind(this)
      this.step = this.step.bind(this)
      this.sendSettlement = this.sendSettlement.bind(this)
      this.acceptOrder = this.acceptOrder.bind(this)
      this.refund = this.refund.bind(this)
      this.confirmationMechanismSend = this.confirmationMechanismSend.bind(this)
      this.getDeliveryInfo = this.getDeliveryInfo.bind(this)
      this.handleSettlementReason = this.handleSettlementReason.bind(this)
      this.handleSettlementAmount = this.handleSettlementAmount.bind(this)
      this.loadSellement = this.loadSellement.bind(this)

    }

   // -------------------------------------------------------RENDER-------------------

    render() {
    return (
      <div>

        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0 text-light"
            target="_blank"
            rel="noopener noreferrer"
          >
            Order contract
          </a>
          <spam className="d-flex text-light">
            { this.state.account }
          </spam>
        </nav>

        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-left">
              <div className="content mr-auto ml-auto">
                {/* Here will be main content */}
                { this.state.deployState === "NOTDEPLOYED" &&
                    <NonCreatedOrderTable order = {this.state.orderFromStoreInfo}
                                          customerAddress = {this.state.account} />
                }
                { this.state.deployState === "DEPLOYED" &&
                   <OrderInfo order = {this.state.order}
                              orderState = {this.state.orderState}
                              account = {this.state.account}/>
                }

                <h1>Products</h1>
                { this.state.orderFromStoreInfo.products.map((product, key) => {
                  return(
                      <Product product = {product}
                               state={this.state.orderState}
                               index = {key}
                               callReturned = {this.callReturned}/>
                  )})}

                <p>
                  { this.state.orderFromStoreInfo.products[0].returned &&
                  "RETURNED product 0"
                  }
                </p>


                <div>
                  <h3>Actions </h3>

                  { this.state.deployState === "NOTDEPLOYED" &&
                  <p>
                    <button type="button" className="btn btn-primary" onClick={this.createOrder}>Create order</button>
                  </p>
                  }
                  { (this.state.orderState === OrderState.CREATED &&
                     this.state.role === Role.CUSTOMER
                  ) &&
                  <p>
                    <button type="button" className="btn btn-primary" onClick={this.payOrder}>Pay order</button>
                  </p>
                  }

                  { ((this.state.orderState === OrderState.CREATED  ||
                      this.state.orderState === OrderState.PAID     ||
                      this.state.orderState === OrderState.ACCEPTED ||
                      this.state.orderState === OrderState.SHIPPED    )&&
                      this.state.role === Role.CUSTOMER
                  ) &&
                  <p>
                    <button type="button" className="btn btn-danger" onClick={this.cancelOrder}>Cancel</button>
                  </p>
                  }



                  { (this.state.orderState === OrderState.PAID &&
                      this.state.role === Role.STORE
                  )  &&
                  <p>
                    <button type="button" className="btn btn-primary" onClick={this.acceptOrder}>Accept order</button>
                    <button type="button" className="btn btn-danger" onClick={this.cancelOrder}>Cancel</button>
                  </p>
                  }
                  { /*  --------------------- CONFIRMATION MECHANISM -------------------------------- */ }
                  { ((this.state.orderState === OrderState.ACCEPTED &&
                      this.state.role === Role.STORE
                  ) || (this.state.orderState === OrderState.DELIVERED &&
                      this.state.role === Role.CUSTOMER
                  )) &&
                  <p>
                    <button type="button"  className={ this.state.sended ? "btn btn-dark" : "btn btn-primary" }
                            onClick={this.confirmShipment}>1. Confirm shipment</button>
                    <button type="button" className="btn btn-secondary" onClick={this.confirmationMechanismSend}>Send confirmation to Order contract</button>

                  </p>
                  }

                  { ((this.state.orderState === OrderState.ACCEPTED &&
                      this.state.role === Role.DELIVERER
                  )|| (this.state.orderState === OrderState.DELIVERED &&
                      this.state.role === Role.DELIVERER
                  ))  &&
                  <p>
                    <button type="button" className={ this.state.sended ? "btn btn-dark" : "btn btn-primary" } onClick={this.confirmRecievment}>2. Confirm receivement</button>
                    <button type="button" className="btn btn-secondary" onClick={this.confirmationMechanismSend}>Send confirmation to Order contract</button>

                  </p>
                  }

                  { ((this.state.orderState === OrderState.SHIPPED &&
                      this.state.role === Role.DELIVERER
                  ) || (this.state.orderState === OrderState.SENTBACK &&
                      this.state.role === Role.DELIVERER
                  ))  &&
                  <p>
                    <button type="button" className={ this.state.sended ? "btn btn-dark" : "btn btn-primary" } onClick={this.confirmShipment}>3. Confirm deliverent</button>
                    <button type="button" className="btn btn-secondary" onClick={this.confirmationMechanismSend}>Send confirmation to Order contract</button>

                  </p>
                  }

                  { ((this.state.orderState === OrderState.SHIPPED &&
                      this.state.role === Role.CUSTOMER
                  ) || (this.state.orderState === OrderState.SENTBACK &&
                      this.state.role === Role.STORE
                  )) &&
                  <p>
                    <button type="button" className={ this.state.sended ? "btn btn-dark" : "btn btn-primary" } onClick={this.confirmRecievment}>4. Confirm receivment</button>
                    <button type="button" className="btn btn-secondary" onClick={this.confirmationMechanismSend}>Send confirmation to Order contract</button>

                  </p>
                  }

                  { /*  --------------------- RETURMENT -------------------------------- */ }

                  { (this.state.orderState === OrderState.DELIVERED &&
                      this.state.role === Role.CUSTOMER
                  )  &&
                  <p>
                    <button type="button" className="btn btn-primary" onClick={this.returnProducts}>Return products</button>
                  </p>
                  }

                  { (this.state.orderState === OrderState.DELIVERED &&
                      this.state.role === Role.STORE
                  )  &&
                  <p>
                    <button type="button" className="btn btn-primary" onClick={this.step}>Claim payment</button>
                  </p>
                  }

                  { (this.state.orderState === OrderState.RETURNED &&
                      this.state.role === Role.STORE
                  )  &&
                  <div>
                    { /*  Form for text and amount */ }
                    <button type="button" className="btn btn-primary" onClick={ this.refund }>Refund</button>

                    <h5>Proposal for settlement</h5>
                    <form>
                      <div className="form-group">
                        <label htmlFor="formGroupExampleInput">Settlement</label>
                        <input type="text" className="form-control" id="formGroupExampleInput"
                               placeholder="Settlement reason" onChange={this.handleSettlementReason}/>
                      </div>
                      <div className="form-group">
                        <label htmlFor="formGroupExampleInput">Amount in ETH</label>
                        <input type="text" className="form-control" id="formGroupExampleInput"
                               placeholder="0.0" onChange={this.handleSettlementAmount}/>
                      </div>
                    </form>

                    <button type="button" className="btn btn-warning" onClick={this.makeSettlement }>Post proposal for settlement</button>
                  </div>
                  }


                  { (this.state.orderState === OrderState.PROPOSALFORSETTLEMENT &&
                      this.state.role === Role.CUSTOMER
                  )  &&
                  <div>
                    { /*  Form for text and amount */ }
                    <h5>Proposal for settlement</h5>
                    <p>Reason: {this.state.settlementReason}</p>
                    <p>Amount: {this.state.settlementAmount}</p>

                    <button type="button" className="btn btn-primary" onClick={this.settlementAccept}>Accept settlement</button>
                    <button type="button" className="btn btn-warning" onClick={this.settlementDecline}>Decline settlement</button>
                  </div>
                  }


                  { (this.state.orderState === OrderState.FROZEN
                    )  &&
                    <p>
                    { /* amount */ }

                    <button type="button" className="btn btn-primary" onClick={this.unfreeze}>Unfroze</button>
                    </p>
                  }


                </div>

              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
