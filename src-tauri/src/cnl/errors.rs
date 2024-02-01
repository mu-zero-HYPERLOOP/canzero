pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    InvalidGetResponseSofFlag,
    InvalidGetResponseEofFlag,
    InvalidGetResponseToggleFlag,
    InvalidGetResponseFormat,
    InvalidGetResponseServerOrObjectEntryNotFound,
    InvalidSetResponseFormat,
    InvalidStreamMessageFormat,
    FragmentationError,
    InvalidCommandMessageFormat,
}

impl Error {
    pub fn reason(&self) -> &str {
        match &self {
            Error::InvalidSetResponseFormat => "invalid set response",
            Error::InvalidStreamMessageFormat => "invalid stream message",
            Error::FragmentationError => "fragmentation error",
            Error::InvalidCommandMessageFormat => "invalid command message",
            Error::InvalidGetResponseSofFlag => "invalid get response: invalid sof bit",
            Error::InvalidGetResponseEofFlag => "invalid get response: invalid eof bit",
            Error::InvalidGetResponseToggleFlag => "invalid get response: invalid toggle bit",
            Error::InvalidGetResponseFormat => "invalid get response format",
            Error::InvalidGetResponseServerOrObjectEntryNotFound => "invalid get response: server or object entry not found",
        }
    }

    pub fn description(&self) -> &str {
        match &self {
            Error::InvalidSetResponseFormat => {
                "the set response message was associated with the wrong message type"
            }
            Error::InvalidStreamMessageFormat => {
                "a stream message was associated with the wrong message type"
            }
            Error::FragmentationError => "something bad happend handling a fragmented message",
            Error::InvalidCommandMessageFormat => {
                "a command message was associated with the wrong message type"
            }
            Error::InvalidGetResponseSofFlag => "invalid get response: invalid sof bit",
            Error::InvalidGetResponseEofFlag => "invalid get response: invalid eof bit",
            Error::InvalidGetResponseToggleFlag => "invalid get response: invalid toggle bit",
            Error::InvalidGetResponseFormat => "invalid get response format",
            Error::InvalidGetResponseServerOrObjectEntryNotFound => "invalid get response: server not found",
        }
    }
}
