import { useState, useRef } from 'react';
import { Plus, Search, Grid, Bookmark, Star, Book, ArrowLeft, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { readExcelFile, parseExcelToBooks, exportBooksToExcel, createExcelTemplate, parseGoodreadsCSV, exportToGoodreadsCSV } from '../utils/excelUtils';
import { enrichMultipleBooks } from '../utils/bookAPIs';

export default function VirtualLibrary() {
  const [books, setBooks] = useState([]);
  const [view, setView] = useState('shelf');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [showBookDetail, setShowBookDetail] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0, bookTitle: '' });
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    pages: 200,
    genre: '',
    status: 'toread',
    rating: 0,
    notes: '',
    dateRead: ''
  });

  const genres = ['Literatura', 'Filosofia', 'Ficcion', 'No ficcion', 'Ciencia ficcion', 'Fantasy', 'Misterio', 'Romance', 'Historia', 'Biografia', 'Ensayo', 'Poesia', 'Cuentos'];

  const spineColors = [
    '#8B4513', '#2F4F4F', '#800000', '#556B2F', '#483D8B',
    '#B22222', '#191970', '#8B008B', '#FF8C00', '#228B22',
    '#DC143C', '#4682B4', '#9932CC', '#B8860B', '#20B2AA'
  ];

  const getSpineColor = (title) => {
    const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return spineColors[hash % spineColors.length];
  };

  const getSpineWidth = (pages) => {
    return Math.max(12, Math.min(120, 12 + (pages / 17)));
  };

  const openBookDetail = (book) => {
    setSelectedBook(book);
    setShowBookDetail(true);
  };

  const closeBookDetail = () => {
    setShowBookDetail(false);
    setSelectedBook(null);
  };

  const updateSelectedBook = (updatedBook) => {
    setBooks(books.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
    setSelectedBook(updatedBook);
  };

  const addBook = () => {
    if (newBook.title && newBook.author) {
      const book = {
        ...newBook,
        id: Date.now(),
        dateAdded: new Date().toISOString().split('T')[0]
      };
      
      setBooks([...books, book]);
      
      setNewBook({
        title: '',
        author: '',
        pages: 200,
        genre: '',
        status: 'toread',
        rating: 0,
        notes: '',
        dateRead: ''
      });
      setShowAddForm(false);
    }
  };

  const updateBookStatus = (id, newStatus) => {
    setBooks(books.map(book => 
      book.id === id ? { ...book, status: newStatus } : book
    ));
  };

  const updateBookRating = (id, rating) => {
    setBooks(books.map(book => 
      book.id === id ? { ...book, rating } : book
    ));
  };

  const loadSampleData = () => {
    const sampleBooks = [
      {
        id: Date.now() + 1,
        title: "Alicia en el pais de las maravillas",
        author: "Lewis Carroll",
        pages: 200,
        genre: "Literatura",
        status: "read",
        rating: 5,
        notes: "Idioma: Ingles",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 2,
        title: "Leviathan",
        author: "Thomas Hobbes",
        pages: 728,
        genre: "Filosofia",
        status: "toread",
        rating: 0,
        notes: "Idioma: Ingles",
        dateAdded: "2025-07-31",
        dateRead: "",
        physical: true
      },
      {
        id: Date.now() + 3,
        title: "Meditaciones metafisicas",
        author: "Rene Descartes",
        pages: 120,
        genre: "Filosofia",
        status: "toread",
        rating: 0,
        notes: "Idioma: Latin",
        dateAdded: "2025-07-31",
        dateRead: "",
        physical: true
      },
      {
        id: Date.now() + 4,
        title: "Discurso del Metodo",
        author: "Rene Descartes",
        pages: 120,
        genre: "Filosofia",
        status: "read",
        rating: 4,
        notes: "Idioma: Frances",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 5,
        title: "Ser y Tiempo",
        author: "Martin Heidegger",
        pages: 450,
        genre: "Filosofia",
        status: "read",
        rating: 5,
        notes: "Idioma: Aleman",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: false
      },
      {
        id: Date.now() + 6,
        title: "Critica de la Razon Pura",
        author: "Immanuel Kant",
        pages: 856,
        genre: "Filosofia",
        status: "read",
        rating: 5,
        notes: "Idioma: Aleman",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 7,
        title: "Critica del Juicio",
        author: "Immanuel Kant",
        pages: 464,
        genre: "Filosofia",
        status: "read",
        rating: 5,
        notes: "Idioma: Aleman",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: false
      },
      {
        id: Date.now() + 8,
        title: "Ficciones",
        author: "Jorge Luis Borges",
        pages: 180,
        genre: "Literatura",
        status: "read",
        rating: 5,
        notes: "Idioma: Espanol",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 9,
        title: "El Aleph",
        author: "Jorge Luis Borges",
        pages: 180,
        genre: "Literatura",
        status: "read",
        rating: 5,
        notes: "Idioma: Espanol",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 10,
        title: "Rayuela",
        author: "Julio Cortazar",
        pages: 635,
        genre: "Literatura",
        status: "read",
        rating: 4,
        notes: "Idioma: Espanol",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 11,
        title: "Cien anos de soledad",
        author: "Gabriel Garcia Marquez",
        pages: 471,
        genre: "Literatura",
        status: "read",
        rating: 4,
        notes: "Idioma: Espanol",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 12,
        title: "El Quijote",
        author: "Miguel de Cervantes",
        pages: 1200,
        genre: "Literatura",
        status: "read",
        rating: 5,
        notes: "Idioma: Espanol",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 13,
        title: "1984",
        author: "George Orwell",
        pages: 328,
        genre: "Literatura",
        status: "read",
        rating: 4,
        notes: "Idioma: Ingles",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 14,
        title: "Animal Farm",
        author: "George Orwell",
        pages: 95,
        genre: "Literatura",
        status: "read",
        rating: 4,
        notes: "Idioma: Ingles",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 15,
        title: "Tractatus Logico-Philosophicus",
        author: "Ludwig Wittgenstein",
        pages: 75,
        genre: "Filosofia",
        status: "toread",
        rating: 0,
        notes: "Idioma: Aleman",
        dateAdded: "2025-07-31",
        dateRead: "",
        physical: true
      },
      {
        id: Date.now() + 16,
        title: "La Metamorfosis",
        author: "Franz Kafka",
        pages: 96,
        genre: "Literatura",
        status: "toread",
        rating: 0,
        notes: "Idioma: Aleman",
        dateAdded: "2025-07-31",
        dateRead: "",
        physical: true
      },
      {
        id: Date.now() + 17,
        title: "Lolita",
        author: "Vladimir Nabokov",
        pages: 368,
        genre: "Literatura",
        status: "read",
        rating: 3,
        notes: "Idioma: Ingles",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 18,
        title: "Macbeth",
        author: "William Shakespeare",
        pages: 200,
        genre: "Literatura",
        status: "read",
        rating: 5,
        notes: "Idioma: Ingles",
        dateAdded: "2025-07-31",
        dateRead: "2024-01-01",
        physical: true
      },
      {
        id: Date.now() + 19,
        title: "Death in Midsummer",
        author: "Yukio Mishima",
        pages: 200,
        genre: "Literatura",
        status: "toread",
        rating: 0,
        notes: "Idioma: Japones",
        dateAdded: "2025-07-31",
        dateRead: "",
        physical: true
      },
      {
        id: Date.now() + 20,
        title: "El Capital",
        author: "Karl Marx",
        pages: 900,
        genre: "Filosofia",
        status: "toread",
        rating: 0,
        notes: "Idioma: Aleman",
        dateAdded: "2025-07-31",
        dateRead: "",
        physical: true
      }
    ];
    setBooks(sampleBooks);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportMessage('Por favor selecciona un archivo de Excel válido (.xlsx o .xls)');
      return;
    }

    setIsLoading(true);
    setImportMessage('');

    try {
      const excelData = await readExcelFile(file);
      const newBooks = parseExcelToBooks(excelData);
      
      if (newBooks.length === 0) {
        setImportMessage('No se encontraron libros válidos en el archivo Excel');
        return;
      }

      const existingTitles = new Set(books.map(book => book.title.toLowerCase()));
      const uniqueBooks = newBooks.filter(book => 
        !existingTitles.has(book.title.toLowerCase())
      );
      
      if (uniqueBooks.length === 0) {
        setImportMessage('Todos los libros del archivo ya existen en tu biblioteca');
      } else {
        setBooks(prevBooks => [...prevBooks, ...uniqueBooks]);
        setImportMessage(`Se importaron ${uniqueBooks.length} libros exitosamente. ${newBooks.length - uniqueBooks.length} libros ya existían.`);
      }
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      setImportMessage(`Error al procesar el archivo: ${error.message}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setImportMessage('Por favor selecciona un archivo CSV válido');
      return;
    }

    setIsLoading(true);
    setImportMessage('Procesando CSV de Goodreads...');
    setEnrichProgress({ current: 0, total: 0, bookTitle: '' });

    try {
      const text = await file.text();
      const parsedBooks = parseGoodreadsCSV(text);
      
      if (parsedBooks.length === 0) {
        setImportMessage('No se encontraron libros válidos en el archivo CSV');
        return;
      }

      const existingTitles = new Set(books.map(book => book.title.toLowerCase()));
      const uniqueBooks = parsedBooks.filter(book => 
        !existingTitles.has(book.title.toLowerCase())
      );
      
      if (uniqueBooks.length === 0) {
        setImportMessage('Todos los libros del archivo ya existen en tu biblioteca');
        return;
      }

      setImportMessage(`Enriqueciendo datos con APIs... (puede tomar unos minutos)`);
      
      // Enriquecer datos con APIs
      const enrichedBooks = await enrichMultipleBooks(uniqueBooks, (current, total, bookTitle) => {
        setEnrichProgress({ current, total, bookTitle });
        setImportMessage(`Enriqueciendo datos: ${current}/${total} - ${bookTitle}`);
      });

      setBooks(prevBooks => [...prevBooks, ...enrichedBooks]);
      setImportMessage(`Se importaron ${enrichedBooks.length} libros de Goodreads exitosamente. ${parsedBooks.length - uniqueBooks.length} libros ya existían.`);
      
    } catch (error) {
      console.error('Error al procesar el archivo CSV:', error);
      setImportMessage(`Error al procesar el archivo CSV: ${error.message}`);
    } finally {
      setIsLoading(false);
      setEnrichProgress({ current: 0, total: 0, bookTitle: '' });
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };

  const handleExportBooks = () => {
    if (books.length === 0) {
      setImportMessage('No hay libros para exportar');
      return;
    }
    
    try {
      exportBooksToExcel(books);
      setImportMessage(`Se exportaron ${books.length} libros exitosamente`);
    } catch (error) {
      console.error('Error al exportar:', error);
      setImportMessage('Error al exportar los libros');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      createExcelTemplate();
      setImportMessage('Plantilla descargada exitosamente');
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      setImportMessage('Error al descargar la plantilla');
    }
  };

  const handleExportToGoodreads = () => {
    if (books.length === 0) {
      setImportMessage('No hay libros para exportar a Goodreads');
      return;
    }
    
    try {
      exportToGoodreadsCSV(books);
      setImportMessage(`Se exportaron ${books.length} libros en formato Goodreads CSV. Puedes importar este archivo en goodreads.com`);
    } catch (error) {
      console.error('Error al exportar a Goodreads:', error);
      setImportMessage('Error al exportar a formato Goodreads');
    }
  };

  const clearImportMessage = () => {
    setTimeout(() => setImportMessage(''), 5000);
  };

  if (importMessage) {
    clearImportMessage();
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || book.status === filter;
    const matchesGenre = selectedGenre === 'all' || book.genre === selectedGenre;
    return matchesSearch && matchesFilter && matchesGenre;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'read': return 'text-green-600';
      case 'reading': return 'text-blue-600';
      case 'toread': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'read': return 'Leido';
      case 'reading': return 'Leyendo';
      case 'toread': return 'Por leer';
      default: return '';
    }
  };

  const BookSpine = ({ book, onClick }) => {
    const spineWidth = getSpineWidth(book.pages);
    const showFullText = spineWidth > 25;
    
    return (
      <div
        className="book-spine cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 relative group"
        style={{
          width: `${spineWidth}px`,
          height: '240px',
          backgroundColor: getSpineColor(book.title),
          background: `linear-gradient(to right, ${getSpineColor(book.title)}, ${getSpineColor(book.title)}dd)`,
          transform: 'rotateY(-15deg)',
          boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
          border: '1px solid rgba(0,0,0,0.2)'
        }}
        onClick={onClick}
      >
        <div className="h-full flex flex-col justify-between p-1 text-white">
          {showFullText ? (
            <>
              <div className="writing-mode-vertical text-center font-semibold overflow-hidden flex-1">
                <div className="transform rotate-180 text-xs leading-tight" style={{ writingMode: 'vertical-rl' }}>
                  {book.title.length > 40 ? book.title.substring(0, 37) + '...' : book.title}
                </div>
              </div>
              <div className="writing-mode-vertical text-center opacity-80 mt-2">
                <div className="transform rotate-180 text-xs" style={{ writingMode: 'vertical-rl' }}>
                  {book.author.length > 20 ? book.author.split(' ').pop() : book.author}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col justify-center items-center">
              <div className="transform rotate-180 text-xs font-bold text-center leading-none" style={{ writingMode: 'vertical-rl' }}>
                {book.title.length > 15 
                  ? book.title.split(' ').map(word => word.charAt(0)).join('').substring(0, 6)
                  : book.title.substring(0, 8)
                }
              </div>
            </div>
          )}
        </div>
        
        {!showFullText && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
            {book.title} - {book.author}
          </div>
        )}
        
        {book.status === 'read' && (
          <div className="absolute top-2 right-1 text-yellow-300">
            <Star size={8} fill="currentColor" />
          </div>
        )}
      </div>
    );
  };

  const BookCard = ({ book }) => (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">{book.title}</h3>
        <span className={`text-sm font-medium ${getStatusColor(book.status)}`}>
          {getStatusLabel(book.status)}
        </span>
      </div>
      <p className="text-gray-600 mb-2">{book.author}</p>
      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
        <span>{book.pages} paginas</span>
        <span>{book.genre}</span>
      </div>
      
      {book.rating > 0 && (
        <div className="flex items-center mb-2">
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star}
              size={16} 
              className={star <= book.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
            />
          ))}
        </div>
      )}
      
      <div className="flex gap-2 mt-3">
        <select 
          value={book.status}
          onChange={(e) => {
            e.stopPropagation();
            updateBookStatus(book.id, e.target.value);
          }}
          className="text-xs px-2 py-1 border rounded"
        >
          <option value="toread">Por leer</option>
          <option value="reading">Leyendo</option>
          <option value="read">Leido</option>
        </select>
        
        <select 
          value={book.rating}
          onChange={(e) => {
            e.stopPropagation();
            updateBookRating(book.id, parseInt(e.target.value));
          }}
          className="text-xs px-2 py-1 border rounded"
        >
          <option value={0}>Sin calificar</option>
          <option value={1}>1 estrella</option>
          <option value={2}>2 estrellas</option>
          <option value={3}>3 estrellas</option>
          <option value={4}>4 estrellas</option>
          <option value={5}>5 estrellas</option>
        </select>
      </div>
      
      {book.notes && (
        <p className="text-sm text-gray-600 mt-2 italic">{book.notes}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="bg-white shadow-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-amber-800 flex items-center gap-2">
              <Book className="text-amber-600" />
              Mi Biblioteca Virtual
            </h1>
            <div className="flex flex-wrap gap-2">
              {books.length === 0 && (
                <button
                  onClick={loadSampleData}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Bookmark size={20} />
                  Cargar biblioteca de muestra
                </button>
              )}
              
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Agregar Libro
              </button>
              
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                >
                  <Upload size={20} />
                  {isLoading ? 'Importando...' : 'Importar Excel'}
                </button>
              </div>
              
              <div className="relative">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <button
                  onClick={() => csvInputRef.current?.click()}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                >
                  <Upload size={20} />
                  {isLoading ? 'Importando...' : 'Importar Goodreads'}
                </button>
              </div>
              
              <button
                onClick={handleExportBooks}
                disabled={books.length === 0}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
              >
                <Download size={20} />
                Exportar Excel
              </button>
              
              <button
                onClick={handleExportToGoodreads}
                disabled={books.length === 0}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
              >
                <Download size={20} />
                Exportar Goodreads
              </button>
              
              <button
                onClick={handleDownloadTemplate}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet size={20} />
                Plantilla
              </button>
            </div>
          </div>
          
          {importMessage && (
            <div className={`mt-4 p-3 rounded-lg ${
              importMessage.includes('Error') || importMessage.includes('error')
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}>
              {importMessage}
              {enrichProgress.total > 0 && (
                <div className="mt-2">
                  <div className="bg-white rounded-full h-2 mb-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(enrichProgress.current / enrichProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-600">
                    {enrichProgress.current}/{enrichProgress.total} - {enrichProgress.bookTitle}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar libros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todos los libros</option>
              <option value="read">Leidos</option>
              <option value="reading">Leyendo</option>
              <option value="toread">Por leer</option>
            </select>
            
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todos los generos</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('shelf')}
                className={`px-3 py-2 ${view === 'shelf' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700'} hover:bg-amber-100 transition-colors`}
              >
                <Bookmark size={20} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-2 ${view === 'grid' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700'} hover:bg-amber-100 transition-colors`}
              >
                <Grid size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <Book size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {books.length === 0 ? 'Comienza tu biblioteca!' : 'No se encontraron libros'}
            </h3>
            <p className="text-gray-500 mb-4">
              {books.length === 0 
                ? 'Agrega tu primer libro para comenzar a construir tu biblioteca virtual.'
                : 'Intenta ajustar los filtros o el termino de busqueda.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-amber-600">{books.length}</div>
                <div className="text-sm text-gray-600">Total de libros</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{books.filter(b => b.status === 'read').length}</div>
                <div className="text-sm text-gray-600">Leidos</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{books.filter(b => b.status === 'reading').length}</div>
                <div className="text-sm text-gray-600">Leyendo</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-gray-600">{books.filter(b => b.status === 'toread').length}</div>
                <div className="text-sm text-gray-600">Por leer</div>
              </div>
            </div>

            {view === 'shelf' && (
              <div className="bg-gradient-to-b from-amber-900 to-amber-800 rounded-lg p-6 shadow-lg">
                {(() => {
                  // Organizar libros en filas basado en el ancho real que ocupan
                  const containerWidth = window.innerWidth > 768 ? 
                    Math.min(1280, window.innerWidth - 100) : // Desktop: max 1280px menos padding
                    window.innerWidth - 60; // Mobile: menos padding
                  
                  const rows = [];
                  let currentRow = [];
                  let currentRowWidth = 0;
                  const gap = 4; // 1 * 4px gap entre libros
                  
                  filteredBooks.forEach(book => {
                    const bookWidth = getSpineWidth(book.pages);
                    const bookWithGap = bookWidth + gap;
                    
                    // Si es el primer libro de la fila o si cabe en la fila actual
                    if (currentRow.length === 0 || currentRowWidth + bookWithGap <= containerWidth) {
                      currentRow.push(book);
                      currentRowWidth += bookWithGap;
                    } else {
                      // No cabe más, empezar nueva fila
                      rows.push(currentRow);
                      currentRow = [book];
                      currentRowWidth = bookWithGap;
                    }
                  });
                  
                  // Agregar la última fila si tiene libros
                  if (currentRow.length > 0) {
                    rows.push(currentRow);
                  }
                  
                  return rows.map((rowBooks, rowIndex) => (
                    <div key={rowIndex} className="mb-6">
                      <div className="flex gap-1 items-end justify-center md:justify-start mb-2" style={{ perspective: '1000px' }}>
                        {rowBooks.map(book => (
                          <BookSpine key={book.id} book={book} onClick={() => openBookDetail(book)} />
                        ))}
                      </div>
                      <div className="w-full h-4 bg-gradient-to-r from-amber-700 to-amber-600 rounded shadow-inner"></div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {view === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map(book => (
                  <div key={book.id} onClick={() => openBookDetail(book)}>
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Libro</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Titulo del libro"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                <input
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Nombre del autor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paginas</label>
                <input
                  type="number"
                  value={newBook.pages}
                  onChange={(e) => setNewBook({...newBook, pages: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genero</label>
                <select
                  value={newBook.genre}
                  onChange={(e) => setNewBook({...newBook, genre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Seleccionar genero</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={newBook.status}
                  onChange={(e) => setNewBook({...newBook, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="toread">Por leer</option>
                  <option value="reading">Leyendo</option>
                  <option value="read">Leido</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas personales</label>
                <textarea
                  value={newBook.notes}
                  onChange={(e) => setNewBook({...newBook, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  rows="3"
                  placeholder="Tus pensamientos sobre el libro..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addBook}
                className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Agregar Libro
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showBookDetail && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={closeBookDetail}
                className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors font-medium"
              >
                <ArrowLeft size={20} />
                Volver a la biblioteca
              </button>
              <button
                onClick={closeBookDetail}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedBook.title}</h2>
              <p className="text-lg text-gray-600 mb-1">por {selectedBook.author}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{selectedBook.pages} paginas</span>
                <span>•</span>
                <span>{selectedBook.genre}</span>
                <span>•</span>
                <span>Agregado: {selectedBook.dateAdded}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado de lectura</label>
                <select
                  value={selectedBook.status}
                  onChange={(e) => {
                    const updatedBook = { ...selectedBook, status: e.target.value };
                    updateSelectedBook(updatedBook);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="toread">Por leer</option>
                  <option value="reading">Leyendo</option>
                  <option value="read">Leido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calificacion</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => {
                        const newRating = star === selectedBook.rating ? 0 : star;
                        const updatedBook = { ...selectedBook, rating: newRating };
                        updateSelectedBook(updatedBook);
                      }}
                      className="transition-colors"
                    >
                      <Star 
                        size={24}
                        className={star <= selectedBook.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-200'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {selectedBook.rating > 0 ? `${selectedBook.rating}/5` : 'Sin calificar'}
                  </span>
                </div>
              </div>
            </div>

            {selectedBook.status === 'read' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de lectura</label>
                <input
                  type="date"
                  value={selectedBook.dateRead}
                  onChange={(e) => {
                    const updatedBook = { ...selectedBook, dateRead: e.target.value };
                    updateSelectedBook(updatedBook);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas personales</label>
              <textarea
                value={selectedBook.notes}
                onChange={(e) => {
                  const updatedBook = { ...selectedBook, notes: e.target.value };
                  updateSelectedBook(updatedBook);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                rows="6"
                placeholder="Escribe tus pensamientos sobre este libro, citas favoritas, analisis personal..."
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Informacion del libro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><strong>Paginas:</strong> {selectedBook.pages}</div>
                <div><strong>Genero:</strong> {selectedBook.genre}</div>
                <div><strong>Estado:</strong> <span className={getStatusColor(selectedBook.status)}>{getStatusLabel(selectedBook.status)}</span></div>
                <div><strong>Fecha agregado:</strong> {selectedBook.dateAdded}</div>
                {selectedBook.dateRead && (
                  <div><strong>Fecha leido:</strong> {selectedBook.dateRead}</div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeBookDetail}
                className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Guardar cambios
              </button>
              <button
                onClick={closeBookDetail}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}