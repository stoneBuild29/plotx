import {
  Transfer as TransferEvent,
  Approval as ApprovalEvent
} from "../generated/plotx/plotx"
import { Transfer, Approval, Allowance, Mint, Burn } from "../generated/schema"
import { BigInt, Address} from "@graphprotocol/graph-ts"

// 检查地址是否为零地址的函数
function isZeroAddress(address: Address): boolean {
  return address.equals(Address.fromString('0x0000000000000000000000000000000000000000'))
}



// "Get the latest transfers"
export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Handle Mint
  if (isZeroAddress(event.params.from)) {
    let mint = new Mint(
      event.transaction.hash.toString() + "-" + event.logIndex.toString()
    )
    mint.blockNumber = event.block.number
    mint.blockTimestamp = event.block.timestamp
    mint.transactionHash = event.transaction.hash
    mint.account = event.params.to // Example: Assigning a value to 'account'
    mint.amount = event.params.value
    mint.save()
  }

  // Handle Burn
  if (isZeroAddress(event.params.to)) {
    let burn = new Burn(
      event.transaction.hash.toString() + "-" + event.logIndex.toString()
    )
    burn.blockNumber = event.block.number
    burn.blockTimestamp = event.block.timestamp
    burn.transactionHash = event.transaction.hash
    burn.save()
  }

}

//"Get the latest approvals"
export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Handle Allowance change
  let allowance = new Allowance(
    event.params.owner.toHex() + "-" + event.params.spender.toHex()
  )
  allowance.owner = event.params.owner
  allowance.spender = event.params.spender
  allowance.value = event.params.value
  allowance.save()
}

