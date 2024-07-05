

# How to read

## Introduction

###### states/
The states/ directory can mostly be ignored it mostly
it just how tauri want's you to manage state. The 
startup state is just interesting for the startup 
window (Duhh) and the CNL state is just one really really big 
state, which contains the complete application state (singleton). 


###### commands/
Here we have all functions that can be called from the frontend
we will take a look at them later.

###### cnl/
This is where we actually do things.


## cnl/
CNL stands for CanzeroNetworkLayer it's a a really big thing
so let's go through this step by step. 

### cnl/can_adapters/mod.rs
For now it's enough to take a look at cnl/can_adapters/mod.rs
here we define what a can adapter does. Effecivly 
it can receive and it can send **CanFrames**.

### cnl/rx/can_receiver.rs
In can_receivers.rs we wan't to take a look at the
inplace function can_receiver_task(...) here we have a 
loop, which constantly calls recv() on a can_adapter 
now after some error handling and if everything goes as
planned we call receive_msg(...), which makes a lookup for a
"Handler" based on the CAN id. In other words we 
define a handler for each CAN id. 

### cnl/handler/mod.rs
A handler is really simple we can give it a CanFrame and it 
does something with it, but because we now 
the CAN id already we now the format of
the message. A handler is defined 
as a rust enum if your comming from C think of
a union with a tag or if your from Object Oriented 
land thing of a abstract class.

We can take a look at one implementation the stream_handler
it is used for parsing and handling stream data.

### cnl/handler/stream_handler.rs
When a CanFrame arrives at a **StreamFrameHandler** it 
simple parses it (all that is happening here is that we parse
the binary data into a proper format). A stream contains 
values like the position of the velocity of the pod. 
In CANzero these variables are called object entries and 
what we are doing here is, is getting these values out of the 
message. And because we already now what CAN id it has 
we know what object entries are contained in the message
so we just forward them to the "ObjectEntryObject". 

Anything ending in Object is something where we store 
data either data that we now from the beginning like 
the name of a node the id etc. or data that we receive 
during a run like the complete history of values of the 
position. 

All of our Objects are defined in cnl/network/
So let's take a look at the most complex one the 
**ObjectEntryObject**

### cnl/network/object_entry_object/mod.rs
The ObjectEntryObject is in charge of managing a
single ObjectEntry for example the position. It has a type 
and a bunch of functions. Everything starting with 
push is something that we receive from a handler a new value
for example. But we can also call listen_to_latest 
on a ObjectEntryObject. This is a function which we can call
from the frontend. Once called we start a seperate
tokio task, which continously updates notifies the frontend
about changes to the value. You can take a look at this 
in the cnl/network/objecct_entry_object/latest/
directory. What we are doing is we are buffering data
so that we don't overweal the frontend. So if 2 values arrive 
really shortly after one another we don't send 2 notification 
we just send the current value. 

Now there is some extra stuff for get requests and so on,
which is really cool to look at, but not super important for
now. 


Now you should be somewhat familiar how we process incomming 
data we receive them from a can_adapter we make a lookup
based on the CAN id to get a handler we call the handler. 
In the example of a stream handler we parse out the values 
contained in it and forward them in a object entry. Here we 
store them. If the Frontend has called listen_to_latest
on the value we will notify it if any new value arrives.

The rest of the handlers work in a similar way they
receive data they parse it and if they have received a 
value they forward the value to the ObjectEntryObject.


## commands/
Commands is another really interessting directory
here we define all functions that we can call from the 
frontend. Feel free to take a look around.


