use can_config_rs::config::Type;

use crate::{cnl::frame::Value, notification::notify_error, notification::notify_info, state::cnl_state::CNLState};

const EXPORT_PATH: &'static str = "./log";

#[tauri::command]
pub async fn export(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, CNLState>,
) -> Result<(), ()> {
    #[cfg(feature = "logging-invoke")]
    println!("invoke: export()");
    let cnl = state.lock().await;

    // ensure that log directory exists.
    let export_dir = std::path::Path::new(EXPORT_PATH);
    if !export_dir.exists() {
        std::fs::create_dir(&export_dir)
            .expect(&format!("Failed to create directory {export_dir:?}"))
    }
    let time = chrono::offset::Local::now();

    let log_dir = export_dir.join(std::path::Path::new(&time.to_string()));
    if log_dir.exists() {
        notify_error(
            &app_handle,
            "LogFile already exits",
            &format!("LogFile {log_dir:?} already exists"),
            time,
        );
        return Result::Err(());
    };

    std::fs::create_dir(&log_dir).expect(&format!("Failed to create directory {log_dir:?}"));

    for node in cnl.nodes() {
        let node_log_dir = log_dir.join(node.name());
        std::fs::create_dir(&node_log_dir).expect("Failed to create directory {node_log_dir:?}");

        for object_entry in node.object_entries() {
            let oe_log_path = node_log_dir.join(&format!("{}.csv", object_entry.name()));
            let history = object_entry.complete_history().await;
            let mut csv_writer = csv::Writer::from_writer(vec![]);
            fn write_header(csv_writer: &mut csv::Writer<Vec<u8>>, ty: &Type, name : &str) -> csv::Result<()> {
                match ty {
                    Type::Enum {
                        name : _,
                        description : _,
                        size : _,
                        entries : _,
                        visibility : _,
                    } |
                    Type::Primitive(_) => csv_writer.write_field(name),
                    Type::Struct {
                        name,
                        description : _,
                        attribs,
                        visibility : _,
                    } => {
                        for (attrib_name, attrib_ty) in attribs {
                            write_header(csv_writer, attrib_ty.as_ref(), &format!("{name}.{attrib_name}"))?;
                        }
                        Ok(())
                    }
                    Type::Array { len : _, ty : _ } => panic!(),
                }
            }

            fn write_record(
                csv_writer: &mut csv::Writer<Vec<u8>>,
                event: &Value,
            ) -> csv::Result<()> {
                match event {
                    Value::UnsignedValue(v) => csv_writer.write_field(v.to_string()),
                    Value::SignedValue(v) => csv_writer.write_field(v.to_string()),
                    Value::RealValue(v) => csv_writer.write_field(v.to_string()),
                    Value::StructValue(attribs) => {
                        for attrib in attribs {
                            write_record(csv_writer, attrib.value())?;
                        }
                        Ok(())
                    }
                    Value::EnumValue(v) => csv_writer.write_field(v.to_string()),
                }
            }
            csv_writer.write_field("timestamp").unwrap();
            write_header(&mut csv_writer, object_entry.ty(), "value").unwrap();
            csv_writer.write_record(None::<&[u8]>).unwrap();
            for event in history {
                csv_writer
                    .write_field(event.timestamp.as_millis().to_string())
                    .unwrap();
                write_record(&mut csv_writer, &event.value).unwrap();
                csv_writer.write_record(None::<&[u8]>).unwrap();
            }
            std::fs::write(oe_log_path, csv_writer.into_inner().unwrap()).unwrap();
        }
    }
    notify_info(&app_handle, "Export successful", &format!("Exported log files to {log_dir:?}"), time);
    Ok(())
}
