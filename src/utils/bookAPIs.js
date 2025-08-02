// APIs para obtener información de libros automáticamente

// Google Books API
export const searchGoogleBooks = async (title, author = '') => {
  try {
    const query = author ? `${title} author:${author}` : title;
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=1`);
    
    if (!response.ok) {
      throw new Error('Error en Google Books API');
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo;
      return {
        title: book.title || title,
        authors: book.authors || [author || 'Autor desconocido'],
        pageCount: book.pageCount || 0,
        thumbnail: book.imageLinks?.thumbnail || null,
        cover: book.imageLinks?.large || book.imageLinks?.medium || book.imageLinks?.thumbnail || null,
        description: book.description || '',
        categories: book.categories || [],
        publishedDate: book.publishedDate || '',
        publisher: book.publisher || '',
        isbn: book.industryIdentifiers?.[0]?.identifier || '',
        averageRating: book.averageRating || 0,
        ratingsCount: book.ratingsCount || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching Google Books:', error);
    return null;
  }
};

// Open Library API (alternativa gratuita sin límites)
export const searchOpenLibrary = async (title, author = '') => {
  try {
    const query = author ? `${title} ${author}` : title;
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodedQuery}&limit=1`);
    
    if (!response.ok) {
      throw new Error('Error en Open Library API');
    }
    
    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0];
      const coverId = book.cover_i;
      
      return {
        title: book.title || title,
        authors: book.author_name || [author || 'Autor desconocido'],
        pageCount: book.number_of_pages_median || 0,
        thumbnail: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
        cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
        description: '',
        categories: book.subject || [],
        publishedDate: book.first_publish_year || '',
        publisher: book.publisher?.[0] || '',
        isbn: book.isbn?.[0] || '',
        averageRating: 0,
        ratingsCount: 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching Open Library:', error);
    return null;
  }
};

// Función principal que intenta ambas APIs
export const enrichBookData = async (book) => {
  let bookData = await searchGoogleBooks(book.title, book.author);
  
  // Si Google Books no encuentra nada, probar Open Library
  if (!bookData || bookData.pageCount === 0) {
    const openLibraryData = await searchOpenLibrary(book.title, book.author);
    if (openLibraryData) {
      bookData = openLibraryData;
    }
  }
  
  if (bookData) {
    return {
      ...book,
      pages: book.pages || bookData.pageCount || 200,
      genre: book.genre || (bookData.categories?.[0] || ''),
      cover: bookData.cover,
      thumbnail: bookData.thumbnail,
      description: bookData.description,
      publishedDate: bookData.publishedDate,
      publisher: bookData.publisher,
      isbn: bookData.isbn,
      averageRating: bookData.averageRating,
      ratingsCount: bookData.ratingsCount,
      needsAPIData: false
    };
  }
  
  return {
    ...book,
    pages: book.pages || 200,
    needsAPIData: false
  };
};

// Procesar múltiples libros con delay para respetar rate limits
export const enrichMultipleBooks = async (books, onProgress = null) => {
  const enrichedBooks = [];
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    
    if (onProgress) {
      onProgress(i + 1, books.length, book.title);
    }
    
    // Solo buscar datos si es necesario
    if (book.needsAPIData || !book.pages || book.pages === 0) {
      const enrichedBook = await enrichBookData(book);
      enrichedBooks.push(enrichedBook);
      
      // Delay de 100ms entre requests para ser respetuoso con las APIs
      await delay(100);
    } else {
      enrichedBooks.push(book);
    }
  }
  
  return enrichedBooks;
};

// Función para obtener solo la portada de un libro
export const getBookCover = async (title, author = '') => {
  const bookData = await searchGoogleBooks(title, author);
  if (bookData && bookData.cover) {
    return bookData.cover;
  }
  
  const openLibraryData = await searchOpenLibrary(title, author);
  if (openLibraryData && openLibraryData.cover) {
    return openLibraryData.cover;
  }
  
  return null;
};