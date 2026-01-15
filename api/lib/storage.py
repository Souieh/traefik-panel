from contextlib import contextmanager
from typing import Optional, Type

from pydantic import BaseModel
from tinydb import TinyDB, where

T = BaseModel


class Storage:
    def __init__(self, path: str):
        self.db = TinyDB(path)

    # CREATE
    def create(self, model: BaseModel) -> BaseModel:
        self.db.insert(model.model_dump(mode="json"))
        return model

    def create_many(self, models: list[BaseModel]) -> list[BaseModel]:
        self.db.insert_multiple([model.model_dump(mode="json") for model in models])
        return models

    # READ
    def get(self, model_cls: Type[T], id: str) -> Optional[T]:
        data = self.db.get(where("id") == id)
        return model_cls.model_validate(data) if data else None

    def find(self, model_cls: Type[T], field: str, value: str) -> list[T]:
        results = self.db.search(where(field) == value)
        return [model_cls.model_validate(item) for item in results]

    def list(self, model_cls: Type[T]) -> list[T]:
        return [model_cls.model_validate(item) for item in self.db.all()]

    # UPDATE
    def update(self, model: BaseModel) -> bool:
        return bool(
            self.db.update(
                model.model_dump(mode="json"),
                where("id") == model.model_dump()["id"],
            )
        )

    def upsert(self, model: T) -> T:
        if self.exists(model.model_dump()["id"]):
            self.update(model)
        else:
            self.create(model)
        return model

    # DELETE
    def delete(self, id: str) -> bool:
        return bool(self.db.remove(where("id") == id))

    def delete_all(self) -> int:
        count = len(self.db)
        self.db.truncate()
        return count

    # META
    def count(self) -> int:
        return len(self.db)

    def exists(self, id: str) -> bool:
        return self.db.contains(where("id") == id)

    @contextmanager
    def batch(self):
        yield self

    def close(self):
        self.db.close()
