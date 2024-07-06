# plotx
PlotX is a decentralized prediction market protocol on Ethereum that focuses on predicting the outcomes of crypto, stocks, and other traditional financial markets. It allows users to create, trade, and settle prediction markets on various events, leveraging the wisdom of the crowd to forecast outcomes. 

### deploy & run screenshot

![run](https://raw.githubusercontent.com/wenjinglee1104/blog_file/master/20240706101121.png)

![deploy](https://raw.githubusercontent.com/wenjinglee1104/blog_file/master/20240706101219.png)

### first use experience

At first, the deployment process is not as smooth as I expected.During the exploring，I have encountered many  problems.

1. understand the importance of the Configuration file

   The critical file on the graph is the ABI json which has detailed description of raw data.Based on this, I could  understand the events, functions, state variables and other information in the smart contract in order to more reasonably parse and process the original data obtained from the blockchain.Downloading the imcomplete ABI json led to the wrong result that some entities can not be accessed.

2. the connection between subgraph & code

   When creating a subgraph, the entity files define data models such as `Transfer` and `Mint`, while `plotx.ts` file writes the event handling logic, extracting data from contract events and creating or updating these entities. Together, they enable the subgraph to listen to and process blockchain events, mapping the data into defined data models for subsequent querying and analysis.

3. handle the  garbled characters

   ![乱码](https://raw.githubusercontent.com/wenjinglee1104/blog_file/master/20240706104338.png)

   ```typescript
   event.transaction.hash.toString() + "-" + event.logIndex.toString()
   ```

   In Solidity smart contracts, `event.transaction.hash` and `event.logIndex` are stored as byte data. Directly converting these data into strings can lead to garbled output because the byte data may contain non-printable or invisible characters, which might not be correctly parsed when converted into strings.

   ```typescript
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
   ```

   `event.transaction.hash.toHex() + "-" + event.logIndex.toString()` converts the transaction hash to a hexadecimal string (`toHex()`) and concatenates it with the log index converted to a string (`toString()`). This approach avoids the previous issues because:

    **Hexadecimal Representation:** `toHex()` converts the byte data of `event.transaction.hash` into a hexadecimal string. Hexadecimal strings only contain characters `0-9` and `a-f` (or `A-F`), making them suitable for direct conversion to strings without encountering non-printable or special characters.

   **String Conversion of Index:** `event.logIndex.toString()` simply converts the numerical log index to a string representation, which doesn't involve any non-printable or special characters.

   Therefore, by using `toHex()` for the transaction hash and `toString()` for the log index, you ensure that both components of the ID are represented as readable and manageable strings, avoiding the previous issues related to byte data and direct string conversion.

4. the attribution of the entity is read-only (to be continued)

   Entities defined in Subgraph usually specify certain properties as immutable. This means that once an entity is created and saved to Subgraph's data store, its property values during storage cannot be directly modified or overwritten.

   I plan to revise the function to enrich the function of handleTransfer.Thus, the function would get the Mint and Burn events associated with this Transfer.Neither Method 1 nor Method 2 can achieve this function.

   ```typescript
   // Method 1:处理 Mint
     if (isZeroAddress(event.params.from)) {
       let mint = new Mint(
         event.transaction.hash.toString() + "-" + event.logIndex.toString()
       )
       mint.blockNumber = event.block.number
       mint.blockTimestamp = event.block.timestamp
       mint.transactionHash = event.transaction.hash
       mint.account = event.params.to
       mint.amount = event.params.value
       mint.save()
   
       // 添加关联到 Transfer 实体
       let transfer = Transfer.load(entity.id)
       if (transfer != null) {
         if (transfer.relatedMints === null) {
           transfer.relatedMints = [mint.id]
         } else {
           transfer.relatedMints.push(mint.id)
         }
         transfer.save()
       }
     }
   ```

   ```typescript
   // Method 2:Handle Mint
   if (isZeroAddress(event.params.from)) {
     let mint = new Mint(
       event.transaction.hash.toString() + "-" + event.logIndex.toString()
     )
     mint.blockNumber = event.block.number
     mint.blockTimestamp = event.block.timestamp
     mint.transactionHash = event.transaction.hash
     mint.account = event.params.to
     mint.amount = event.params.value
     mint.save()
   
     // 创建 MintsOnTransfer 实体并关联
     let mintsOnTransfer = new MintsOnTransfer(
       event.transaction.hash.concatI32(event.logIndex.toI32()).toString()
     )
     mintsOnTransfer.transfer = entity.id
     mintsOnTransfer.mint = mint.id
     mintsOnTransfer.save()
   
     // 添加关联到 Transfer 实体
     let transfer = Transfer.load(entity.id)
     if (transfer != null) {
       if (transfer.relatedMints.length == 0) {
         transfer.relatedMints = [mint.id]
       } else {
         transfer.relatedMints.push(mint.id)
       }
       transfer.save()
     }
   }
   ```

   
