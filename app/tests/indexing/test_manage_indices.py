from typing import List
from data_source.api.basic_document import BasicDocument
from data_source.api.basic_document import BasicDocument
from indexing.index_documents import Indexer
from indexing.pinecone_index import PineconeIndex
from data_source.api.basic_document import DocumentType 
import datetime
from indexing.bm25_index import Bm25Index
from indexing.faiss_index import FaissIndex
from indexing.pinecone_index import PineconeIndex



test_text = '''
“War! The Republic is crumbling under attacks by the ruthless Sith Lord, Count Dooku.
There are heroes on both sides. Evil is everywhere. 
In a stunning move, the fiendish droid leader, General Grievous,
has swept into the Republic capital and kidnapped Chancellor Palpatine, 
leader of the Galactic Senate. As the Separatist Droid Army 
attempts to flee the besieged capital with their valuable hostage, 
two Jedi Knights lead a desperate mission 
to rescue the captive Chancellor…”
'''

def setup():
	if PineconeIndex.instance is None:
		PineconeIndex.connect()
	# if FaissIndex.instance is None:
	# 	FaissIndex.create()
	if Bm25Index.instance is None:
		Bm25Index.create()

def test_add_index():
	setup()
	documents: List[BasicDocument] = [
		BasicDocument(
			id='some_id',
			data_source_id=1,
			content=test_text,
			title='star wars crawl',
			type=DocumentType.DOCUMENT,
			timestamp=datetime.datetime.now(),
			author='Precept',
			author_image_url='image_url',
			location='test_location',
			url='webviewUrl'
		)
	]
	print(documents[0])
	Indexer.index_documents(documents)


