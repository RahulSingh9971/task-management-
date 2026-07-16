import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/config';

// -------------------------------------------------------------
// USER MODEL
// -------------------------------------------------------------
export class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public passwordHash!: string | null;
  public role!: 'Admin' | 'Manager' | 'Employee';
  public photo!: string | null;
  public skills!: string | null; // Comma separated or JSON string
  public experience!: string | null;
  public availability!: boolean;
  public googleId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for Google OAuth accounts
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Manager', 'Employee'),
      defaultValue: 'Employee',
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    experience: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    availability: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
  }
);

// -------------------------------------------------------------
// CLIENT MODEL
// -------------------------------------------------------------
export class Client extends Model {
  public id!: number;
  public name!: string;
  public company!: string;
  public email!: string;
  public phone!: string | null;
  public gst!: string | null;
  public address!: string | null;
  public notes!: string | null;
}

Client.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gst: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Client',
    tableName: 'Clients',
  }
);

// -------------------------------------------------------------
// PROJECT MODEL
// -------------------------------------------------------------
export class Project extends Model {
  public id!: number;
  public name!: string;
  public clientName!: string | null;
  public clientId!: number | null;
  public description!: string | null;
  public startDate!: string | null; // YYYY-MM-DD
  public endDate!: string | null; // YYYY-MM-DD
  public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  public status!: 'Planning' | 'In Progress' | 'Testing' | 'On Hold' | 'Completed' | 'Cancelled';
  public budget!: number | null;
  public category!: string | null;
  public technologiesUsed!: string | null; // JSON string array
  public teamMembers!: string | null; // JSON string of User IDs
  public colorLabel!: string | null;
  public tags!: string | null; // JSON string array
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      defaultValue: 'Medium',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Planning', 'In Progress', 'Testing', 'On Hold', 'Completed', 'Cancelled'),
      defaultValue: 'Planning',
      allowNull: false,
    },
    budget: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    technologiesUsed: {
      type: DataTypes.TEXT, // Will store stringified array
      allowNull: true,
    },
    teamMembers: {
      type: DataTypes.TEXT, // Will store stringified array of User IDs
      allowNull: true,
    },
    colorLabel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tags: {
      type: DataTypes.TEXT, // Will store stringified array
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'Projects',
  }
);

// -------------------------------------------------------------
// TASK MODEL
// -------------------------------------------------------------
export class Task extends Model {
  public id!: number;
  public title!: string;
  public description!: string | null;
  public assignedUserId!: number | null;
  public dueDate!: string | null; // YYYY-MM-DD
  public startDate!: string | null; // YYYY-MM-DD
  public estimatedHours!: number | null;
  public actualHours!: number | null;
  public priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  public status!: 'Todo' | 'In Progress' | 'Review' | 'Completed';
  public labels!: string | null; // JSON string array
  public checklist!: string | null; // JSON string of {text: string, completed: boolean}[]
  public projectId!: number;

  // Associations
  public project?: Project;
  public assignedUser?: User;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assignedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: true,
    },
    actualHours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      defaultValue: 'Medium',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Todo', 'In Progress', 'Review', 'Completed'),
      defaultValue: 'Todo',
      allowNull: false,
    },
    labels: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    checklist: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'Tasks',
  }
);

// -------------------------------------------------------------
// EVENT MODEL
// -------------------------------------------------------------
export class Event extends Model {
  public id!: number;
  public eventName!: string;
  public relatedProjectId!: number | null;
  public relatedTaskId!: number | null;
  public description!: string | null;
  public reminder!: 'Today' | 'Tomorrow' | 'Next Week' | 'None';
  public startTime!: Date;
  public endTime!: Date;
  public color!: string | null;
  public repeatEvent!: 'None' | 'Daily' | 'Weekly' | 'Monthly';
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    eventName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    relatedProjectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relatedTaskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reminder: {
      type: DataTypes.ENUM('Today', 'Tomorrow', 'Next Week', 'None'),
      defaultValue: 'None',
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    repeatEvent: {
      type: DataTypes.ENUM('None', 'Daily', 'Weekly', 'Monthly'),
      defaultValue: 'None',
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'Events',
  }
);

// -------------------------------------------------------------
// COMMENT MODEL
// -------------------------------------------------------------
export class Comment extends Model {
  public id!: number;
  public content!: string;
  public taskId!: number;
  public userId!: number;
  public parentId!: number | null;
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Comment',
    tableName: 'Comments',
  }
);

// -------------------------------------------------------------
// ATTACHMENT MODEL
// -------------------------------------------------------------
export class Attachment extends Model {
  public id!: number;
  public filename!: string;
  public filepath!: string;
  public mimetype!: string | null;
  public size!: number | null;
  public projectId!: number | null;
  public taskId!: number | null;
}

Attachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filepath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Attachment',
    tableName: 'Attachments',
  }
);

// -------------------------------------------------------------
// NOTE MODEL
// -------------------------------------------------------------
export class Note extends Model {
  public id!: number;
  public title!: string;
  public content!: string | null;
  public projectId!: number | null;
}

Note.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Note',
    tableName: 'Notes',
  }
);

// -------------------------------------------------------------
// NOTIFICATION MODEL
// -------------------------------------------------------------
export class Notification extends Model {
  public id!: number;
  public type!: string;
  public message!: string;
  public read!: boolean;
  public userId!: number;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications',
  }
);

// -------------------------------------------------------------
// ACTIVITYLOG MODEL
// -------------------------------------------------------------
export class ActivityLog extends Model {
  public id!: number;
  public action!: string;
  public details!: string | null;
  public projectId!: number | null;
  public taskId!: number | null;
  public userId!: number | null;
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'ActivityLogs',
  }
);

// -------------------------------------------------------------
// TIMELOG MODEL
// -------------------------------------------------------------
export class TimeLog extends Model {
  public id!: number;
  public taskId!: number;
  public userId!: number;
  public startTime!: Date | null;
  public endTime!: Date | null;
  public durationSeconds!: number;
  public isRunning!: boolean;
}

TimeLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    isRunning: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'TimeLog',
    tableName: 'TimeLogs',
  }
);

// -------------------------------------------------------------
// WIDGETCONFIG MODEL
// -------------------------------------------------------------
export class WidgetConfig extends Model {
  public id!: number;
  public userId!: number;
  public widgetName!: string;
  public positionX!: number;
  public positionY!: number;
  public sizeX!: number;
  public sizeY!: number;
  public visible!: boolean;
}

WidgetConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    widgetName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    positionX: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    positionY: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sizeX: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
    },
    sizeY: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
    },
    visible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'WidgetConfig',
    tableName: 'WidgetConfigs',
  }
);

// -------------------------------------------------------------
// ASSOCIATIONS
// -------------------------------------------------------------

// Client <-> Project
Client.hasMany(Project, { foreignKey: 'clientId', onDelete: 'SET NULL' });
Project.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Project <-> Task
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// User <-> Task
User.hasMany(Task, { foreignKey: 'assignedUserId', onDelete: 'SET NULL' });
Task.belongsTo(User, { foreignKey: 'assignedUserId', as: 'assignedUser' });

// Task <-> Comment
Task.hasMany(Comment, { foreignKey: 'taskId', onDelete: 'CASCADE' });
Comment.belongsTo(Task, { foreignKey: 'taskId' });

// User <-> Comment
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Comment <-> Comment (Self reply)
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies', onDelete: 'CASCADE' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

// Project/Task <-> Attachment
Project.hasMany(Attachment, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Attachment.belongsTo(Project, { foreignKey: 'projectId' });

Task.hasMany(Attachment, { foreignKey: 'taskId', onDelete: 'CASCADE' });
Attachment.belongsTo(Task, { foreignKey: 'taskId' });

// Project <-> Note
Project.hasMany(Note, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Note.belongsTo(Project, { foreignKey: 'projectId' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Task <-> TimeLog
Task.hasMany(TimeLog, { foreignKey: 'taskId', onDelete: 'CASCADE' });
TimeLog.belongsTo(Task, { foreignKey: 'taskId' });

// User <-> TimeLog
User.hasMany(TimeLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
TimeLog.belongsTo(User, { foreignKey: 'userId' });

// User <-> WidgetConfig
User.hasMany(WidgetConfig, { foreignKey: 'userId', onDelete: 'CASCADE' });
WidgetConfig.belongsTo(User, { foreignKey: 'userId' });

export default sequelize;
