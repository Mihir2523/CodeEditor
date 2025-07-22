import mongoengine as me

class Code(me.Document):
    user = me.ReferenceField('Userss')  # Placeholder for actual user document
    code = me.StringField(required=True)
    isComplete = me.BooleanField(default=False)
    imageExist = me.BooleanField(default=False)
    imageLink = me.StringField(default='')
    errors = me.BooleanField(default=False)
    output = me.StringField(default='')
    
    meta = {'collection': 'codes'}  # Ensure it matches backend collection name
