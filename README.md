# Diploma Thesis
## Folder structure description

```
+-- exermal attachments
|   +-- EA1 As-is model.png			
|   +-- EA1 As-is model.bpmn	
|   +-- EA2 To-be model.png	
|   +-- EA2 To-be model.bpmn							
|   +-- EA3 Requiretements and use-cases.pdf
|   +-- EA4 DasContract to-be model.png		
|   +-- EA4 DasContract to-be model.bpmn	
|   +-- EA5 PoCMetricts.pdf			
|   +-- EA6 ThesisShowcase.mov
|   +-- EA7 code.mov
|   +-- EA8 process simulation.pdf
|   +-- EA9 Diagrams.pdf
+-- src // Proof od concept source files
|   +-- migrations
|   +-- public
|   +-- src
|   +-- +-- abis
|   +-- +-- components
|   +-- +-- contracts
|   +-- test
|   +-- truffle-config.js
+-- text
|   +-- thesis // Thisis source files
|   +-- thesis.pdf
+-- readme.md
+-- LICENCE
```

## Video
Video links:

EA6 Thesis showsace
https://youtu.be/apiL0WqxZmo

EA7 Code:
https://youtu.be/x_bh8ERS6b4


## Proof of concept
###Dependencies:
-  Node.js

`brew install node`

or download from:
https://nodejs.org/en/


- Ganache

Install from: https://www.trufflesuite.com/ganache

- Truffle

`npm install -g truffle`

- Metamask 

 chrome extension: https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn


- OpenZeppeline Contracts

`npm install @openzeppelin/contracts`


###Project setup
For start an application firstly run ganache application to run your local Ethereum network. Click on quickstart.

Open your terminal and go to the src/orderApp directory and run commant to install node modules.

`node install`

You will maybe need to run `sudo npm audit fix` if npm ask for it.

####Compile and Migrate contract
Firstly compile all contract

`truffle compile -all`

Migrate contracts to the blockchain

`truffle migrate`

For run tests: (not necessary for frontEnd application)

`truffle test`

####Front end application

For run application

`npm run start`

Don't forget to import your account from ganache.