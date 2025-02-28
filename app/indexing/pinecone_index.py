import os 
import pinecone
import torch
import numpy as np
from typing import List

class PineconeIndex:
	instance = None

	@staticmethod
	def create():
		if PineconeIndex.instance is not None:
			raise RuntimeError("Index is already initialized")

		pinecone.init(
			api_key=os.environ["PINECONE_DEFAULT_API_KEY"], 
			environment=os.environ["PINECONE_DEFAULT_ENVIRONMENT"]
		)
		PineconeIndex.instance = PineconeIndex()
		PineconeIndex.instance.namespace = "precept_test_namespace"

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
		# split in batches of 1000
		data_batches = [data[i:i + 1000] for i in range(0, len(data), 1000)] 
		for b in data_batches:
			self.index.upsert(b)
	
	def remove(self, ids: List[int]):
		ids = [str(i) for i in ids] 
		ids = [ids[i:i + 1000] for i in range(0, len(ids), 1000)]
		for batch in ids:
			self.index.delete(batch, namespace=self.namespace)

	def search(self, queries: torch.FloatTensor, top_k: int, *args, **kwargs):
		# if queries.ndim == 1:
		# 	queries = queries.unsqueeze(0) 

		print('calling')
		resp = self.index.query(queries.cpu().tolist(), top_k=top_k, namespace=self.namespace, *args, **kwargs)
		ids = [[int(m['id']) for m in resp['matches']]]
		print(ids)
		return ids

	def clear(self):
		self.index.delete(delete_all=True, namespace=self.namespace)
