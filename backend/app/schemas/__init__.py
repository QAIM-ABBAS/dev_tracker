"""Pydantic schemas — re-export all for convenience."""
from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


from app.schemas.microtodo import (  # noqa: E402, F401
    MicroTodoBase,
    MicroTodoCreate,
    MicroTodoOut,
    MicroTodoUpdate,
)
from app.schemas.note import NoteBase, NoteCreate, NoteOut, NoteUpdate  # noqa: E402, F401
from app.schemas.project import (  # noqa: E402, F401
    ProjectBase,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
)
from app.schemas.status import StatusBase, StatusCreate, StatusOut, StatusUpdate  # noqa: E402, F401
from app.schemas.tag import TagBase, TagCreate, TagOut, TagUpdate  # noqa: E402, F401
from app.schemas.task import (  # noqa: E402, F401
    TaskBase,
    TaskBulkMove,
    TaskCard,
    TaskCreate,
    TaskMove,
    TaskOut,
    TaskUpdate,
)
from app.schemas.webhook import (  # noqa: E402, F401
    WebhookDeploy,
    WebhookGitPR,
    WebhookResult,
)

__all__ = [
    "ORMBase",
    "MicroTodoBase",
    "MicroTodoCreate",
    "MicroTodoOut",
    "MicroTodoUpdate",
    "NoteBase",
    "NoteCreate",
    "NoteOut",
    "NoteUpdate",
    "ProjectBase",
    "ProjectCreate",
    "ProjectOut",
    "ProjectUpdate",
    "StatusBase",
    "StatusCreate",
    "StatusOut",
    "StatusUpdate",
    "TagBase",
    "TagCreate",
    "TagOut",
    "TagUpdate",
    "TaskBase",
    "TaskBulkMove",
    "TaskCard",
    "TaskCreate",
    "TaskMove",
    "TaskOut",
    "TaskUpdate",
    "WebhookDeploy",
    "WebhookGitPR",
    "WebhookResult",
]
