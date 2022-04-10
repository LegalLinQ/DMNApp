import React, {useCallback, useMemo} from 'react';
import {useDropzone} from 'react-dropzone';

export const baseStyle = { 
  flex: 1,
  display: 'flex',
  //flexDirection: 'column', 
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out'
};

export const activeStyle = {
  borderColor: '#2196f3'
};

export const acceptStyle = {
  borderColor: '#00e676'
};

export const rejectStyle = {
  borderColor: '#ff1744'
};

export function DropzoneElement(props) {
    const onDrop = useCallback((acceptedFiles) => {
    //make sure excel is processed last
    acceptedFiles.forEach((file, index) => {
      //make sure excel is loaded as last file, after that processing starts
      if(acceptedFiles.length > 1 && index < acceptedFiles.length-1 &&
        file['type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ){  acceptedFiles.push(acceptedFiles.splice(index, 1)[0]);  }
    });

    //process files
    acceptedFiles.forEach((file, index) => {//@ts-ignore
      const reader = new FileReader()
      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        props.uploaded(file, reader.result, index, acceptedFiles.length);
      }
    })
  }, []);

  const {
    acceptedFiles, 
    rejectedFiles,
    getRootProps, 
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({onDrop, accept:props.allowedFileTypes });

  const style = useMemo(() => ({
    ...baseStyle,
    ...(isDragActive ? activeStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isDragActive,
    isDragReject
  ]);
  
  const acceptedFilesItems = acceptedFiles.map(file => (
    <li key={file.name}>
      You have uploaded {file.name}.
    </li>
  ));
 
  const rejectedFilesItems = rejectedFiles.map(file => (
    <span>Rejected file: {file.name} (only files ending on .docx, .xlsx, or .dmn files are accepted) </span>
  ));

  return (
    <section className="container">
      <div {...getRootProps({style})}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
      <aside>{acceptedFilesItems} </aside>
      <aside>{rejectedFilesItems} </aside>
    </section>
  );
}