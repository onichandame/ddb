<!-- vim-markdown-toc GFM -->

* [Requirements](#requirements)
  * [Local App on Different Devices](#local-app-on-different-devices)
  * [Shared App By Different Users](#shared-app-by-different-users)
* [Design](#design)
  * [Interface](#interface)
  * [Engine](#engine)

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
2. Engine: The implementation-specific part that handles the retrieval, saving and synchronization of the data
3. Storage: The place where the data is finally stored to or initially retrieved from

## Interface

The presentation of the lib should resemble the popular open-source databases on the market. This pricinple ensures that most people will find it not too difficult to learn.

The first edition only implements the key-value presentation with the following data types:

1. string
2. unordered set
3. ordered set
4. list

## Engine

The data types must be conflict-free, meaning when a conflict happens during synchronization, all the peers will finally converge to the same final state. To achieve this, the data must be accompanied by some metadata:

- full history of the changes being made
  - the creator of the changes
  - the uid of the change
