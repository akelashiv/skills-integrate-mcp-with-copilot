"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import os
from pathlib import Path
from typing import Optional

app = FastAPI(
    title="Mergington High School API",
    description="API for viewing and signing up for extracurricular activities and managing tasks",
)

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount(
    "/static",
    StaticFiles(directory=os.path.join(Path(__file__).parent, "static")),
    name="static",
)

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"],
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"],
    },
}

# In-memory task database
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    date_time: Optional[str] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "todo"

class TaskUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    date_time: Optional[str]
    priority: Optional[str]
    status: Optional[str]

class Task(TaskCreate):
    id: int

# Task storage
tasks: dict[int, Task] = {
    1: Task(id=1, title="Study for math exam", description="Review chapter 5 and do practice problems", date_time="2026-03-20 18:00", priority="high", status="todo"),
    2: Task(id=2, title="Complete science lab report", description="Write conclusion and submit PDF", date_time="2026-03-21 20:00", priority="medium", status="in progress"),
}
next_task_id = 3

@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")

@app.get("/activities")
def get_activities():
    return activities

@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity = activities[activity_name]
    if email in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is already signed up")
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}

@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity = activities[activity_name]
    if email not in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is not signed up for this activity")
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}

# Task lifecycle endpoints
@app.get("/tasks")
def list_tasks():
    return list(tasks.values())

@app.post("/tasks")
def create_task(task_data: TaskCreate):
    global next_task_id
    task = Task(id=next_task_id, **task_data.dict())
    tasks[next_task_id] = task
    next_task_id += 1
    return task

@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]

@app.put("/tasks/{task_id}")
def update_task(task_id: int, task_data: TaskUpdate):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    existing = tasks[task_id]
    update_data = task_data.dict(exclude_unset=True)
    updated = existing.copy(update=update_data)
    tasks[task_id] = updated
    return updated

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    del tasks[task_id]
    return {"message": "Task deleted"}
