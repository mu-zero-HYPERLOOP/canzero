
export interface Friend {
  node_name: string,
  object_entry_name: string,
}

export interface ErrorEvent{
    level: string,
    deprecated: boolean,
    label: string,
    description?: string,
    friend?: Friend,
    timestamp : string,
}
