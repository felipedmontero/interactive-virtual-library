import * as XLSX from 'xlsx';

export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        });
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const parseExcelToBooks = (excelData) => {
  if (!excelData || excelData.length < 2) {
    throw new Error('El archivo Excel debe tener al menos una fila de encabezados y una fila de datos');
  }
  
  const headers = excelData[0].map(header => 
    typeof header === 'string' ? header.toLowerCase().trim() : ''
  );
  
  const titleIndex = findColumnIndex(headers, ['titulo', 'title', 'nombre']);
  const authorIndex = findColumnIndex(headers, ['autor', 'author']);
  const pagesIndex = findColumnIndex(headers, ['paginas', 'pages', 'páginas']);
  const genreIndex = findColumnIndex(headers, ['genero', 'genre', 'género', 'categoria']);
  const statusIndex = findColumnIndex(headers, ['estado', 'status']);
  const ratingIndex = findColumnIndex(headers, ['calificacion', 'rating', 'puntuacion', 'estrellas']);
  const notesIndex = findColumnIndex(headers, ['notas', 'notes', 'comentarios', 'observaciones', 'idioma']);
  const dateReadIndex = findColumnIndex(headers, ['fecha_leido', 'date_read', 'fechaleido', 'leido']);
  const physicalIndex = findColumnIndex(headers, ['fisico', 'physical', 'formato']);
  
  if (titleIndex === -1) {
    throw new Error('No se encontró una columna de título. Asegúrate de que exista una columna con el nombre "titulo", "title" o "nombre"');
  }
  
  const books = [];
  
  for (let i = 1; i < excelData.length; i++) {
    const row = excelData[i];
    
    if (!row[titleIndex] || typeof row[titleIndex] !== 'string') {
      continue;
    }
    
    const title = row[titleIndex].trim();
    if (!title) continue;
    
    const book = {
      id: Date.now() + i,
      title: title,
      author: authorIndex !== -1 && row[authorIndex] ? row[authorIndex].toString().trim() : 'Autor desconocido',
      pages: pagesIndex !== -1 ? parseInt(row[pagesIndex]) || 200 : 200,
      genre: genreIndex !== -1 && row[genreIndex] ? row[genreIndex].toString().trim() : '',
      status: parseStatus(statusIndex !== -1 ? row[statusIndex] : ''),
      rating: ratingIndex !== -1 ? parseInt(row[ratingIndex]) || 0 : 0,
      notes: notesIndex !== -1 && row[notesIndex] ? row[notesIndex].toString().trim() : '',
      dateRead: dateReadIndex !== -1 ? parseDate(row[dateReadIndex]) : '',
      dateAdded: new Date().toISOString().split('T')[0],
      physical: physicalIndex !== -1 ? parsePhysical(row[physicalIndex]) : true
    };
    
    if (book.rating > 5) book.rating = 5;
    if (book.rating < 0) book.rating = 0;
    
    books.push(book);
  }
  
  return books;
};

const findColumnIndex = (headers, possibleNames) => {
  for (const name of possibleNames) {
    const index = headers.findIndex(header => 
      header.includes(name) || name.includes(header)
    );
    if (index !== -1) return index;
  }
  return -1;
};

const parseStatus = (status) => {
  if (!status) return 'toread';
  
  const statusStr = status.toString().toLowerCase().trim();
  
  if (statusStr.includes('leido') || statusStr.includes('read') || statusStr.includes('terminado') || statusStr.includes('finished')) {
    return 'read';
  }
  
  if (statusStr.includes('leyendo') || statusStr.includes('reading') || statusStr.includes('actual') || statusStr.includes('current')) {
    return 'reading';
  }
  
  return 'toread';
};

const parseDate = (dateValue) => {
  if (!dateValue) return '';
  
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }
  
  if (typeof dateValue === 'number') {
    const date = XLSX.SSF.parse_date_code(dateValue);
    return new Date(date.y, date.m - 1, date.d).toISOString().split('T')[0];
  }
  
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return '';
};

const parsePhysical = (value) => {
  if (!value) return true;
  
  const valueStr = value.toString().toLowerCase().trim();
  
  if (valueStr.includes('digital') || valueStr.includes('ebook') || valueStr.includes('pdf') || valueStr.includes('kindle')) {
    return false;
  }
  
  return true;
};

export const exportBooksToExcel = (books, filename = 'biblioteca_libros.xlsx') => {
  const data = [
    ['Titulo', 'Autor', 'Paginas', 'Genero', 'Estado', 'Calificacion', 'Notas', 'Fecha_Leido', 'Fecha_Agregado', 'Formato']
  ];
  
  books.forEach(book => {
    data.push([
      book.title,
      book.author,
      book.pages,
      book.genre,
      getStatusLabel(book.status),
      book.rating,
      book.notes,
      book.dateRead,
      book.dateAdded,
      book.physical ? 'Fisico' : 'Digital'
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Libros');
  
  XLSX.writeFile(workbook, filename);
};

const getStatusLabel = (status) => {
  switch(status) {
    case 'read': return 'Leido';
    case 'reading': return 'Leyendo';
    case 'toread': return 'Por leer';
    default: return 'Por leer';
  }
};

export const createExcelTemplate = () => {
  const templateData = [
    ['Titulo', 'Autor', 'Paginas', 'Genero', 'Estado', 'Calificacion', 'Notas', 'Fecha_Leido', 'Formato'],
    ['Ejemplo: Cien años de soledad', 'Gabriel García Márquez', 471, 'Literatura', 'Leido', 5, 'Idioma: Español', '2024-01-15', 'Fisico'],
    ['Ejemplo: 1984', 'George Orwell', 328, 'Literatura', 'Por leer', 0, 'Idioma: Inglés', '', 'Digital']
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla_Libros');
  
  XLSX.writeFile(workbook, 'plantilla_biblioteca.xlsx');
};