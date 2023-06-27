import os 
import pinecone
import torch

class PineconeIndex:
	instance = None

	@staticmethod
	def connect():
		pinecone.init(
			api_key=os.environ["PINECONE_DEFAULT_API_KEY"], 
			environment=os.environ["PINECONE_DEFAULT_ENVIRONMENT"]
		)
		PineconeIndex.instance = PineconeIndex()

	@staticmethod
	def get() -> 'PineconeIndex':
		if PineconeIndex.instance is None:
			raise RuntimeError("Index is not initialized")
		return PineconeIndex.instance

	def __init__(self) -> None:
		self.index = pinecone.Index("precept-main")

	# TODO figure out namespaces
	def update(self, ids: torch.LongTensor, embeddings: torch.FloatTensor):
		# not sure what ids are here 
		data = [(str(iD), embedding.tolist()) for iD, embedding in zip(ids, embeddings)]	
		self.index.upsert(data)
	
	def remove(self, ids: torch.LongTensor):
		self.namespace = "precept_test_namespace"
		self.index.delete(ids, namespace=self.namespace)

	def search(self, queries: torch.FloatTensor, top_k: int, *args, **kwargs):
		if queries.ndim == 1:
			queries = queries.unsqueeze(0)
		_, ids = self.index.query(queries.cpu(), top_k, namespace=self.namespace, *args, **kwargs)
		return ids

	def clear(self):
		self.index.delete(delete_all=True, namespace=self.namespace)
