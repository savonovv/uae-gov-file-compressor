use wasm_bindgen::prelude::*;
use lopdf::{Document, Object, Stream};
use image::codecs::jpeg::JpegDecoder;
use image::{ImageDecoder, ImageEncoder};
use std::io::Cursor;

#[wasm_bindgen]
pub fn compress_pdf(data: &[u8], _quality: u8) -> Vec<u8> {
    let mut doc = match Document::load_mem(data) {
        Ok(d) => d,
        Err(_) => return data.to_vec(),
    };

    // Strip metadata
    let _ = doc.trailer.set("Info", Object::Null);
    
    // Get all objects and find images
    let objects = doc.objects.clone();
    
    for (obj_id, obj) in objects.iter() {
        if let Ok(stream) = obj.as_stream() {
            let dict = stream.dict.clone();
            
            // Check if this is an image stream (DCTDecode = JPEG)
            if let Ok(filter) = dict.get(b"Filter") {
                let filter_str = format!("{:?}", filter);
                if filter_str.contains("DCTDecode") {
                    // This is a JPEG image - try to recompress it
                    if let Ok(content_obj) = doc.get_object(*obj_id) {
                        if let Object::Stream(s) = content_obj {
                            let image_data = s.content.clone();
                            if let Some(recompressed) = recompress_jpeg(&image_data) {
                                let new_stream = Stream::new(dict, recompressed);
                                let _ = doc.objects.insert(*obj_id, Object::Stream(new_stream));
                            }
                        }
                    }
                }
            }
        }
    }

    // Save using in-memory writer
    let mut output = Vec::new();
    if let Ok(mut file) = lopdf::File::memory() {
        if doc.save(&mut file).is_ok() {
            output = file.bytes().unwrap().to_vec();
        }
    }
    
    if output.is_empty() {
        data.to_vec()
    } else {
        output
    }
}

fn recompress_jpeg(jpeg_data: &[u8]) -> Option<Vec<u8>> {
    // Decode JPEG using image crate
    let decoder = JpegDecoder::new(Cursor::new(jpeg_data)).ok()?;
    let (width, height) = decoder.dimensions();
    
    let mut rgb = vec![0u8; (width * height * 3) as usize];
    decoder.read_image(&mut rgb).ok()?;
    
    let mut output = Vec::new();
    {
        let encoder = image::codecs::jpeg::JpegEncoder::new(&mut output);
        encoder.write_image(&rgb, width, height, image::ExtendedColorType::Rgb8).ok()?;
    }
    
    Some(output)
}

#[wasm_bindgen]
pub fn get_pdf_info(data: &[u8]) -> String {
    match Document::load_mem(data) {
        Ok(doc) => {
            let page_count = doc.get_pages().len();
            format!("{{\"pages\":{}}}", page_count)
        }
        Err(_) => r#"{"pages":0,"error":"failed to parse PDF"}"#.to_string(),
    }
}