pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    InvalidGetResponseFormat,
    InvalidGetResponseFieldFormat{field : &'static str},
    InvalidGetResponseServerNotFound,
    InvalidGetResponseObjectEntryNotFound,
    InvalidSetResponseFormat,
    InvalidStreamMessageFormat,
    FragmentationError,
    InvalidCommandMessageFormat,
}

impl Error {
    pub fn reason(&self) -> &str {
        match &self {
            Error::InvalidGetResponseFormat => "invalid get response",
            Error::InvalidGetResponseFieldFormat { field } => "invalid get response",
            Error::InvalidGetResponseServerNotFound => "invalid get response",
            Error::InvalidGetResponseObjectEntryNotFound => "invalid get response",
            Error::InvalidSetResponseFormat => "invalid set response",
            Error::InvalidStreamMessageFormat => "invalid stream message",
            Error::FragmentationError => "fragmentation error",
            Error::InvalidCommandMessageFormat => "invalid command message",
        }
    }

    pub fn description(&self) -> &str {
        match &self {
            Error::InvalidGetResponseFormat => "the get response message was associated with the wrong message type",
            Error::InvalidGetResponseFieldFormat{field} => "failed to parse field {field} from the get response message",
            Error::InvalidGetResponseServerNotFound => "server not found",
            Error::InvalidGetResponseObjectEntryNotFound => "object entry not found",
            Error::InvalidSetResponseFormat => "the set response message was associated with the wrong message type",
            Error::InvalidStreamMessageFormat => "a stream message was associated with the wrong message type",
            Error::FragmentationError => "something bad happend handling a fragmented message",
            Error::InvalidCommandMessageFormat => "a command message was associated with the wrong message type",
        }
    }
}
