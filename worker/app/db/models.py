from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import DeclarativeBase, relationship
from datetime import datetime, timezone


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    createdAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    jobs = relationship("Job", back_populates="user")


class Preset(Base):
    __tablename__ = "Preset"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    meetingType = Column(String, nullable=False)
    outputFormats = Column(String, nullable=False)  # JSON array
    promptTemplate = Column(Text, nullable=False)
    reportTemplate = Column(String, default="briefing")
    slideFormat = Column(String, default="detailed")
    isDefault = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updatedAt = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    jobs = relationship("Job", back_populates="preset")


class Job(Base):
    __tablename__ = "Job"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    presetId = Column(String, ForeignKey("Preset.id"), nullable=False)
    status = Column(String, default="pending")
    statusMessage = Column(String, nullable=True)

    originalFileName = Column(String, nullable=False)
    uploadedFilePath = Column(String, nullable=False)
    fileType = Column(String, nullable=False)

    notebookId = Column(String, nullable=True)
    sourceId = Column(String, nullable=True)

    summaryText = Column(Text, nullable=True)
    reportPath = Column(String, nullable=True)
    slidesPath = Column(String, nullable=True)
    templateConfig = Column(Text, nullable=True)  # JSON: slide design template settings

    errorMessage = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updatedAt = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="jobs")
    preset = relationship("Preset", back_populates="jobs")
