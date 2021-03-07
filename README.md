<!-- vim-markdown-toc GFM -->

* [Requirements](#requirements)
  * [Local App on Different Devices](#local-app-on-different-devices)
  * [Shared App By Different Users](#shared-app-by-different-users)
* [Design](#design)
  * [Interface](#interface)
  * [Engine](#engine)
    * [Conflict Resolving Algorithm](#conflict-resolving-algorithm)
      * [Naturally Concurrent Data](#naturally-concurrent-data)
      * [Naturally Unconcurrent Data](#naturally-unconcurrent-data)
    * [Synchronization](#synchronization)
  * [Storage](#storage)
    * [String/Number](#stringnumber)

<!-- vim-markdown-toc -->

# Requirements

A fully de-centrailized database is required. Common use cases are:

## Local App on Different Devices

A user usually has many different devices. These devices has no knowledge of each other but the user expects to access the same database on all of them.

1. A database hosted on many different devices
2. Each device has all the data required to perform bussiness logics
3. All the copies of the same database must converge after synchronization
4. Synchronization must be quick and easy from the user's point of view

## Shared App By Different Users

Many apps today require some sort of shared data between different users. Examples are chatroom, forums, etc.

1. Every piece of data is created by a single user
2. Every user requires data created by other users
3. Synchronization between devices and users must be quick and real-time

# Design

The first edition of the standard is made to meet the [first requirement](#local-app-on-different-devices).

The database is divided into 3 layers:

1. Interface: A generic interface that presents the data. Should be similiar to other SQL/NoSQL databases
2. Engine: The implementation-specific part that handles the retrieval, conflict resolving and synchronization of the data
3. Storage: The place where the data is finally stored to or initially retrieved from

## Interface

The presentation of the lib should resemble the popular open-source databases in the market. This pricinple ensures that most people will find it not too difficult to learn.

The first edition only implements the key-value presentation with the following data types:

1. string
2. number
3. unordered set
4. ordered set

## Engine

The data types must be conflict-free, meaning when a conflict happens during synchronization, all the peers will finally converge to the same final state. To achieve this, the data must be accompanied by some metadata:

* public key of its creator
* full history of the changes being made. each record includes the following:
  * the hash of the record signed by its creator's private key
  * the date of the change
  * the lamport clock of the change

Every piece of the data in a database must be marked by a unique id created by the engine, essentially forming a key-value data space. When the interface requests for a data, it must provide the key of the data as the input.

Every record must be signed by only one creator. The histories must be validated against the public key of the creator. Only the valid records are kept.

### Conflict Resolving Algorithm

The data types can be divided into 2 categories in terms of the confilct resolving tactics:

1. naturally concurrent, such as counter
2. naturally unconcurrent, such as a string field

#### Naturally Concurrent Data

If all the mutating operations satisfy the following conditions, the data is considered naturally concurrent.

1. commutative
2. idempotent

The `commutative` property ensures that the histories can be delivered in any order. The `idempotent` property ensures if a change is delivered multiple times, the final effect would be the same.

Examples are counter and unorderd set.

#### Naturally Unconcurrent Data

Most primitives are not concurrent by nature. So we will use primitives as an example.

Consider a simple string field created by Tom on his smartphone. Later it is synchronized to his laptop. He then changes the string from empty to `hello` on hhis laptop while his smartphone is offline. Soon he change the value to `world` on his smartphone. Finally his smartphone goes online and receives updates from the laptop.

The conflict resolving strategy is simple:

1. check the least upper bound of these 2 forks. These forks are found to be concurrent and does not have a casaul order
2. check the lamport clock of the last record of these 2 forks. They are found to be the same.
3. check the creation timestamp of the forks. They are found to be created at the same time as the clock of the devices are not synced
4. Compare the encoded utf8 code of the last state of these 2 forks, keep the greater one. So `world` is the winner

Now if more changes are made, they follow the empty-to-`world` record.

### Synchronization

As the history of a piece of data can be long, a full synchronization is not always possible. The plausible synchronization strategy is as follows:

1. a device sends a synchronization request to another device with the following input:
    * uid of the database
    * creator of the database(public key)
    * the signed hash of all the heads already stored
2. the host finds the database requested and searches for the heads received
3. Starting from the heads, find all the following changes and send them back to the requester
4. the client merges all the received records to its local storage

## Storage

The reservoir of all the data and metadata should be well-tested SQL/NoSQL databases or plain files.

The first edition is only planned for IndexedDB.

A database is stored in an object in IndexedDB as follows:

* creator id(public key)
* data(map)

The structure of different data types is different.

### String/Number

* value
* lamport clock
* timestamp
* hash(all of the above fields)
