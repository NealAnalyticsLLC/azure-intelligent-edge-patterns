# Generated by Django 3.0.7 on 2020-07-27 07:39

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('azure_training', '0001_initial'),
        ('azure_parts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Image',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='images/')),
                ('labels', models.CharField(max_length=1000, null=True)),
                ('is_relabel', models.BooleanField(default=False)),
                ('confidence', models.FloatField(default=0.0)),
                ('uploaded', models.BooleanField(default=False)),
                ('customvision_id', models.CharField(blank=True, max_length=1000, null=True)),
                ('remote_url', models.CharField(max_length=1000, null=True)),
                ('part', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='azure_parts.Part')),
                ('project', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='azure_training.Project')),
            ],
        ),
    ]
